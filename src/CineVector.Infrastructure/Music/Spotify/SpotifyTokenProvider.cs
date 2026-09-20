using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.Extensions.Options;

namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Gestisce l'Authorization Code Flow di Spotify per uno o più "profili" (app Spotify distinte, vedi
/// <see cref="SpotifyAppProfile"/>): da marzo 2026 Spotify ha eliminato l'accesso alla ricerca/catalogo pubblico
/// tramite Client Credentials Flow, serve un login utente reale almeno una volta, e le app "Development Mode"
/// possono essere bloccate (rate limit, requisiti sull'account proprietario) — da qui il bisogno di più profili
/// con fallback automatico invece di uno solo. Ogni profilo ha il proprio login one-time, il proprio refresh
/// token (Redis) e la propria cache in memoria dell'access token corrente.</summary>
public class SpotifyTokenProvider(IHttpClientFactory httpClientFactory, SpotifyAccountStore accountStore, IOptions<SpotifyOptions> options)
{
    private const string HttpClientName = "SpotifyAuth";

    private class CachedToken
    {
        public string? AccessToken;
        public DateTimeOffset ExpiresAt = DateTimeOffset.MinValue;
        public readonly SemaphoreSlim Lock = new(1, 1);
    }

    private readonly Dictionary<string, CachedToken> _cache = options.Value.Profiles.ToDictionary(p => p.Name, _ => new CachedToken());

    public IReadOnlyList<SpotifyAppProfile> Profiles => options.Value.Profiles;

    public (string Url, string State) BuildAuthorizeUrl(string profile)
    {
        var (clientId, _) = GetCredentials(profile);
        // Il profilo è incapsulato nello state stesso: è l'unico modo per il callback di sapere quale coppia
        // Client ID/Secret usare per lo scambio, dato che lo state è l'unica cosa che Spotify ci restituisce.
        var state = $"{profile}::{Guid.NewGuid():N}";
        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["response_type"] = "code",
            ["redirect_uri"] = options.Value.RedirectUri,
            ["state"] = state,
            ["scope"] = options.Value.Scope,
        };
        var queryString = string.Join("&", query.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
        return ($"{options.Value.AuthBaseUrl.TrimEnd('/')}/authorize?{queryString}", state);
    }

    public static (string Profile, string Nonce) ParseState(string state)
    {
        var parts = state.Split("::", 2);
        return parts.Length == 2 ? (parts[0], parts[1]) : (parts[0], "");
    }

    public async Task ExchangeCodeAsync(string profile, string code, CancellationToken ct)
    {
        var payload = await PostTokenRequestAsync(
            profile,
            new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = options.Value.RedirectUri,
            },
            ct);

        if (string.IsNullOrWhiteSpace(payload.RefreshToken))
        {
            throw new InvalidOperationException("Spotify non ha restituito un refresh token.");
        }

        await accountStore.SetRefreshTokenAsync(profile, payload.RefreshToken);
        CacheAccessToken(profile, payload);
    }

    public async Task<bool> IsConnectedAsync(string profile) => await accountStore.GetRefreshTokenAsync(profile) is not null;

    public async Task DisconnectAsync(string profile)
    {
        await accountStore.ClearAsync(profile);
        if (_cache.TryGetValue(profile, out var cached))
        {
            cached.AccessToken = null;
            cached.ExpiresAt = DateTimeOffset.MinValue;
        }
    }

    public async Task<string> GetValidAccessTokenAsync(string profile, CancellationToken ct)
    {
        var cached = _cache[profile];
        if (cached.AccessToken is not null && DateTimeOffset.UtcNow < cached.ExpiresAt)
        {
            return cached.AccessToken;
        }

        await cached.Lock.WaitAsync(ct);
        try
        {
            if (cached.AccessToken is not null && DateTimeOffset.UtcNow < cached.ExpiresAt)
            {
                return cached.AccessToken;
            }

            var refreshToken = await accountStore.GetRefreshTokenAsync(profile)
                ?? throw new SpotifyNotConnectedException(profile);

            var payload = await PostTokenRequestAsync(
                profile,
                new Dictionary<string, string>
                {
                    ["grant_type"] = "refresh_token",
                    ["refresh_token"] = refreshToken,
                },
                ct);

            // Spotify a volte ruota il refresh token quando lo rinnova: se ne arriva uno nuovo va salvato,
            // altrimenti quello vecchio resta valido e va tenuto.
            if (!string.IsNullOrWhiteSpace(payload.RefreshToken) && payload.RefreshToken != refreshToken)
            {
                await accountStore.SetRefreshTokenAsync(profile, payload.RefreshToken);
            }

            CacheAccessToken(profile, payload);
            return cached.AccessToken!;
        }
        finally
        {
            cached.Lock.Release();
        }
    }

    private void CacheAccessToken(string profile, SpotifyTokenResponse payload)
    {
        var cached = _cache[profile];
        cached.AccessToken = payload.AccessToken;
        // Margine di sicurezza di 60s per evitare di usare un token appena scaduto per via di latenza di rete.
        cached.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(0, payload.ExpiresIn - 60));
    }

    private async Task<SpotifyTokenResponse> PostTokenRequestAsync(string profile, Dictionary<string, string> formFields, CancellationToken ct)
    {
        var (clientId, clientSecret) = GetCredentials(profile);
        var http = httpClientFactory.CreateClient(HttpClientName);
        var basicAuth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, "api/token")
        {
            Content = new FormUrlEncodedContent(formFields),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);

        var response = await http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<SpotifyTokenResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Risposta token Spotify non valida.");
    }

    private (string ClientId, string ClientSecret) GetCredentials(string profile)
    {
        var config = options.Value.Profiles.FirstOrDefault(p => p.Name == profile)
            ?? throw new InvalidOperationException($"Profilo Spotify '{profile}' non configurato.");

        var clientId = Environment.GetEnvironmentVariable(config.ClientIdEnvironmentVariable);
        var clientSecret = Environment.GetEnvironmentVariable(config.ClientSecretEnvironmentVariable);
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException(
                $"Variabili d'ambiente '{config.ClientIdEnvironmentVariable}'/'{config.ClientSecretEnvironmentVariable}' non impostate per il profilo '{profile}'.");
        }

        return (clientId, clientSecret);
    }
}

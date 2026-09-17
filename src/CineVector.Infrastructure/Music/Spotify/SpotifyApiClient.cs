using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Client per la sola ricerca nel catalogo pubblico Spotify (mai libreria/playlist di un utente).
/// Fallback esplicito, scritto a mano, tra i profili configurati (vedi <see cref="SpotifyOptions.Profiles"/>):
/// se il profilo preferito è bloccato/non collegato, prova il successivo, in ordine, prima di arrendersi. I
/// fallimenti di rete transitori sui singoli tentativi restano gestiti dall'handler di resilienza già
/// registrato sull'HttpClient in DI (retry/circuit breaker), questo livello gestisce solo il cambio di account.</summary>
public class SpotifyApiClient(HttpClient httpClient, SpotifyTokenProvider tokenProvider)
{
    public async Task<SpotifySearchResponse?> SearchTracksAsync(string query, int limit, CancellationToken ct)
    {
        var attempted = new List<Exception>();
        var anyConnected = false;

        foreach (var profile in tokenProvider.Profiles)
        {
            string token;
            try
            {
                token = await tokenProvider.GetValidAccessTokenAsync(profile.Name, ct);
            }
            catch (SpotifyNotConnectedException)
            {
                continue; // profilo non collegato: salta al successivo senza contarlo come fallimento vero e proprio
            }

            anyConnected = true;
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // "market" è consigliato da Spotify per la ricerca: senza, i risultati non sono filtrati per
            // disponibilità regionale (rischio di brani non riproducibili/anteprima assente per l'account).
            var response = await httpClient.GetAsync(
                $"search?q={Uri.EscapeDataString(query)}&type=track&limit={limit}&market=US", ct);

            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<SpotifySearchResponse>(cancellationToken: ct);
            }

            var body = await response.Content.ReadAsStringAsync(ct);
            attempted.Add(new HttpRequestException(
                $"Profilo '{profile.Name}': ricerca Spotify fallita con stato {(int)response.StatusCode} ({response.StatusCode}): {body}",
                null,
                response.StatusCode));
            // Continua col profilo successivo: un 403/429 su questo non deve bloccare gli altri.
        }

        if (!anyConnected)
        {
            throw new SpotifyNotConnectedException();
        }

        throw new AggregateException("Tutti i profili Spotify configurati hanno fallito la ricerca.", attempted);
    }
}

using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Music;
using CineVector.Contracts.Music;
using CineVector.Infrastructure.Music.Spotify;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/spotify")]
public class SpotifyController(
    SpotifyApiClient client,
    SpotifyTokenProvider tokenProvider,
    SpotifyAccountStore accountStore,
    IITunesLookupService itunesLookup) : ControllerBase
{
    /// <summary>Login one-time dell'amministratore per un profilo/app specifico (GET, non JSON: naviga
    /// direttamente qui dal browser). Da marzo 2026 Spotify richiede un account reale anche per la sola
    /// ricerca pubblica — un solo account collegato per profilo serve per tutta l'app, non un login
    /// per-utente di CineVector. Più profili (vedi SpotifyOptions.Profiles) permettono un fallback automatico
    /// se uno viene bloccato (rate limit, restrizioni sull'account proprietario).</summary>
    [HttpGet("login")]
    public async Task<IActionResult> Login([FromQuery] string profile = "primary")
    {
        if (tokenProvider.Profiles.All(p => p.Name != profile))
        {
            return BadRequest(new { error = $"Profilo Spotify '{profile}' non configurato." });
        }

        var (authorizeUrl, state) = tokenProvider.BuildAuthorizeUrl(profile);
        await accountStore.SetPendingStateAsync(profile, state);
        return Redirect(authorizeUrl);
    }

    /// <summary>Il frontend (pagina /callback) riceve "code"/"state" da Spotify e li inoltra qui: lo scambio
    /// col client secret avviene solo lato backend, mai nel browser. Il profilo è ricavato dallo state stesso
    /// (vedi SpotifyTokenProvider.BuildAuthorizeUrl), non da un parametro separato: è l'unico modo affidabile
    /// per sapere quale coppia Client ID/Secret usare, dato che Spotify ci restituisce solo "code" e "state".</summary>
    [HttpPost("callback")]
    public async Task<IActionResult> Callback([FromBody] SpotifyCallbackRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.State))
        {
            return BadRequest(new { error = "Parametri 'code'/'state' mancanti." });
        }

        var (profile, _) = SpotifyTokenProvider.ParseState(request.State);
        if (!await accountStore.ConsumePendingStateAsync(profile, request.State))
        {
            return BadRequest(new { error = "State non valido o scaduto: riprova il collegamento." });
        }

        try
        {
            await tokenProvider.ExchangeCodeAsync(profile, request.Code, ct);
            return Ok(new { connected = true, profile });
        }
        catch (Exception)
        {
            return StatusCode(502, new { error = "Scambio del codice con Spotify fallito.", profile });
        }
    }

    /// <summary>Stato di collegamento di ciascun profilo configurato, in ordine di priorità.</summary>
    [HttpGet("status")]
    public async Task<ActionResult<object>> Status()
    {
        var statuses = new List<object>();
        foreach (var profileConfig in tokenProvider.Profiles)
        {
            statuses.Add(new { profile = profileConfig.Name, connected = await tokenProvider.IsConnectedAsync(profileConfig.Name) });
        }
        return Ok(statuses);
    }

    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect([FromQuery] string profile = "primary")
    {
        await tokenProvider.DisconnectAsync(profile);
        return Ok(new { connected = false, profile });
    }

    /// <summary>Ricerca brani nel catalogo pubblico Spotify — usata sia dal modal di dettaglio film (match
    /// automatico su titolo/colonna sonora) sia dalla pagina Musica (ricerca libera). Tenta i profili configurati
    /// in ordine (fallback automatico su blocchi/rate limit) e restituisce solo i campi utili al frontend, mai
    /// le credenziali/token dell'app.</summary>
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyCollection<SpotifyTrackDto>>> Search(
        [FromQuery] string query, [FromQuery] int limit, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { error = "Il parametro 'query' è obbligatorio." });
        }

        var effectiveLimit = limit is > 0 and <= 50 ? limit : 10;

        try
        {
            var raw = await client.SearchTracksAsync(query, effectiveLimit, ct);
            var tracks = (raw?.Tracks?.Items ?? []).Select(ToDto).ToList();

            // Dal 27 nov 2024 Spotify riserva "preview_url" alle app in Extended Quota Mode: per questa app è
            // sempre null. iTunes fornisce ancora anteprime reali gratis, senza autenticazione — Spotify resta
            // la fonte di ricerca/match (catalogo migliore), iTunes riempie solo l'audio riproducibile mancante.
            await Task.WhenAll(tracks.Where(t => t.PreviewUrl is null).Select(async t =>
            {
                t.PreviewUrl = await itunesLookup.FindPreviewUrlAsync(t.Artists, t.Title, ct);
            }));

            return Ok(tracks);
        }
        catch (SpotifyNotConnectedException)
        {
            return StatusCode(409, new { error = "Nessun account Spotify collegato (nessun profilo).", code = "not_connected" });
        }
        catch (AggregateException ex)
        {
            var messages = ex.InnerExceptions.Select(e => e.Message);
            return StatusCode(502, new { error = string.Join(" | ", messages), code = "spotify_upstream_error" });
        }
    }

    private static SpotifyTrackDto ToDto(SpotifyTrackItem item) => new()
    {
        Id = item.Id,
        Title = item.Name,
        Artists = string.Join(", ", item.Artists.Select(a => a.Name)),
        Album = item.Album?.Name,
        ImageUrl = item.Album?.Images.FirstOrDefault()?.Url,
        PreviewUrl = item.PreviewUrl,
        SpotifyUrl = item.ExternalUrls?.Spotify ?? $"https://open.spotify.com/track/{item.Id}",
    };
}

public class SpotifyCallbackRequest
{
    public string? Code { get; set; }
    public string? State { get; set; }
}

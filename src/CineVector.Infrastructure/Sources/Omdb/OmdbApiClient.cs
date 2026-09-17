using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace CineVector.Infrastructure.Sources.Omdb;

/// <summary>Client per l'API pubblica OMDb (http://omdbapi.com/). A differenza di TMDb, l'autenticazione è una
/// api key in query string su ogni richiesta (nessun header): OMDb inoltre risponde sempre HTTP 200 e segnala
/// gli esiti negativi con "Response": "False" nel body, mai con uno status code di errore.</summary>
public class OmdbApiClient(HttpClient httpClient, IOptions<OmdbOptions> options)
{
    public async Task<OmdbSearchResponse?> SearchAsync(string title, int page, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"?s={Uri.EscapeDataString(title)}&page={page}&apikey={ApiKey}", ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OmdbSearchResponse>(cancellationToken: ct);
        return result is { Response: "True" } ? result : null;
    }

    public async Task<OmdbMovieDetail?> GetByIdAsync(string imdbId, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"?i={Uri.EscapeDataString(imdbId)}&plot=full&apikey={ApiKey}", ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OmdbMovieDetail>(cancellationToken: ct);
        return result is { Response: "True" } ? result : null;
    }

    private string ApiKey =>
        Uri.EscapeDataString(options.Value.ApiKey
            ?? throw new InvalidOperationException("OmdbOptions.ApiKey non valorizzata: PostConfigure non eseguito."));
}

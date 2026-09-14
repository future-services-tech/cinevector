using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace CineVector.Infrastructure.Sources.Tmdb;

/// <summary>Client per l'API pubblica TMDb (https://developer.themoviedb.org/). Legge solo metadati cinematografici;
/// non contatta mai endpoint di streaming/riproduzione, che TMDb del resto non espone.</summary>
public class TmdbApiClient(HttpClient httpClient, IOptions<TmdbOptions> options)
{
    public async Task<TmdbDiscoverResponse?> DiscoverMoviesAsync(int page, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"discover/movie?sort_by=popularity.desc&page={page}&language={Uri.EscapeDataString(options.Value.Language)}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TmdbDiscoverResponse>(cancellationToken: ct);
    }

    /// <summary>Ricerca film per titolo (stessa forma di risposta di /discover/movie).</summary>
    public async Task<TmdbDiscoverResponse?> SearchMoviesAsync(string title, int page, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"search/movie?query={Uri.EscapeDataString(title)}&page={page}&language={Uri.EscapeDataString(options.Value.Language)}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TmdbDiscoverResponse>(cancellationToken: ct);
    }

    /// <summary>Trova la persona più rilevante per il nome indicato (TMDb ordina i risultati per rilevanza/popolarità),
    /// o null se non trovata.</summary>
    public async Task<TmdbPersonSummary?> SearchPersonAsync(string name, CancellationToken ct)
    {
        var response = await httpClient.GetAsync($"search/person?query={Uri.EscapeDataString(name)}", ct);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<TmdbSearchPersonResponse>(cancellationToken: ct);
        return result?.Results.FirstOrDefault();
    }

    /// <summary>Tutti i film (cast + crew, con il ruolo) a cui una persona ha partecipato secondo TMDb.</summary>
    public async Task<TmdbPersonMovieCreditsResponse?> GetPersonMovieCreditsAsync(int personId, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"person/{personId}/movie_credits?language={Uri.EscapeDataString(options.Value.Language)}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TmdbPersonMovieCreditsResponse>(cancellationToken: ct);
    }

    public async Task<TmdbMovieDetail?> GetMovieDetailAsync(int tmdbId, CancellationToken ct)
    {
        var response = await httpClient.GetAsync(
            $"movie/{tmdbId}?append_to_response=credits,keywords&language={Uri.EscapeDataString(options.Value.Language)}", ct);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TmdbMovieDetail>(cancellationToken: ct);
    }
}

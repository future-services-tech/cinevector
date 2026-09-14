using Microsoft.Extensions.Options;
using MovieCatalog.Application.Crawling;
using MovieCatalog.Domain.Enums;

namespace MovieCatalog.Infrastructure.Sources.Tmdb;

/// <summary>Adapter per TMDb (https://www.themoviedb.org/): discovery e dettaglio via API ufficiale, non scraping HTML.
/// L'URL "scoperto" e restituito come PlatformUrl è sempre la pagina pubblica TMDb del film, mai un player o uno stream.</summary>
public class TmdbSourceAdapter(TmdbApiClient client, IOptions<TmdbOptions> options) : ISourceAdapter
{
    public string Name => "Tmdb";

    public Task<IReadOnlyCollection<string>> DiscoverMovieUrlsAsync(CrawlQuery query, CancellationToken cancellationToken) =>
        query.Mode switch
        {
            CrawlQueryMode.Popular => DiscoverPagedAsync(
                (page, ct) => client.DiscoverMoviesAsync(page, ct), cancellationToken),
            CrawlQueryMode.Title => DiscoverPagedAsync(
                (page, ct) => client.SearchMoviesAsync(RequireQuery(query), page, ct), cancellationToken),
            CrawlQueryMode.Actor => DiscoverByPersonAsync(RequireQuery(query), job: null, cancellationToken),
            CrawlQueryMode.Director => DiscoverByPersonAsync(RequireQuery(query), job: "Director", cancellationToken),
            CrawlQueryMode.Producer => DiscoverByPersonAsync(RequireQuery(query), job: "Producer", cancellationToken),
            _ => throw new NotSupportedException($"Criterio di ricerca '{query.Mode}' non supportato da TMDb.")
        };

    private static string RequireQuery(CrawlQuery query) =>
        string.IsNullOrWhiteSpace(query.Query)
            ? throw new InvalidOperationException($"Il criterio '{query.Mode}' richiede un valore di ricerca.")
            : query.Query;

    /// <summary>Paginazione condivisa da discovery "popolari" e ricerca per titolo: stessa forma di risposta
    /// (page/results/total_pages), limitata a <see cref="TmdbOptions.DiscoverPages"/> pagine per esecuzione.</summary>
    private async Task<IReadOnlyCollection<string>> DiscoverPagedAsync(
        Func<int, CancellationToken, Task<TmdbDiscoverResponse?>> fetchPage, CancellationToken ct)
    {
        var urls = new List<string>();

        for (var page = 1; page <= options.Value.DiscoverPages; page++)
        {
            var response = await fetchPage(page, ct);
            if (response is null || response.Results.Count == 0)
            {
                break;
            }

            urls.AddRange(response.Results.Select(r => BuildPlatformUrl(r.Id)));

            if (page >= response.TotalPages)
            {
                break;
            }
        }

        return urls;
    }

    /// <summary>Risolve la persona più rilevante per <paramref name="name"/> e restituisce i film cui ha partecipato:
    /// tutto il cast se <paramref name="job"/> è null (modalità Attore), altrimenti solo i crediti crew con quel
    /// esatto Job TMDb (es. "Director", "Producer"). Nessuna paginazione: /person/{id}/movie_credits è già completo.</summary>
    private async Task<IReadOnlyCollection<string>> DiscoverByPersonAsync(string name, string? job, CancellationToken ct)
    {
        var person = await client.SearchPersonAsync(name, ct)
            ?? throw new InvalidOperationException($"Nessuna persona trovata su TMDb per '{name}'.");

        var credits = await client.GetPersonMovieCreditsAsync(person.Id, ct);
        if (credits is null)
        {
            return [];
        }

        var movieIds = job is null
            ? credits.Cast.Select(c => c.Id)
            : credits.Crew.Where(c => c.Job == job).Select(c => c.Id);

        return movieIds.Distinct().Select(BuildPlatformUrl).ToList();
    }

    public async Task<MovieMetadata?> ExtractMovieMetadataAsync(string url, CancellationToken cancellationToken)
    {
        var tmdbId = ExtractTmdbId(url);
        if (tmdbId is null)
        {
            return null;
        }

        var detail = await client.GetMovieDetailAsync(tmdbId.Value, cancellationToken);
        if (detail is null)
        {
            return null;
        }

        int? year = null;
        if (!string.IsNullOrWhiteSpace(detail.ReleaseDate) && detail.ReleaseDate.Length >= 4 &&
            int.TryParse(detail.ReleaseDate[..4], out var parsedYear))
        {
            year = parsedYear;
        }

        var directors = detail.Credits?.Crew
            .Where(c => c.Job == "Director")
            .Select(c => new MoviePersonRef(c.Name, BuildProfileImageUrl(c.ProfilePath)))
            .DistinctBy(d => d.Name)
            .ToList() ?? [];

        var crew = detail.Credits?.Crew
            .Select(c => (c.Name, Role: MapCrewRole(c.Job), c.ProfilePath))
            .Where(c => c.Role.HasValue)
            .Select(c => new MovieCrewMemberMetadata(c.Name, c.Role!.Value, BuildProfileImageUrl(c.ProfilePath)))
            .Distinct()
            .ToList() ?? [];

        var cast = detail.Credits?.Cast
            .OrderBy(c => c.Order)
            .Take(10)
            .Select(c => new MovieCastMemberMetadata(c.Name, c.Character, c.Order, BuildProfileImageUrl(c.ProfilePath)))
            .ToList() ?? [];

        return new MovieMetadata
        {
            ExternalId = detail.Id.ToString(),
            Title = detail.Title ?? $"TMDb #{detail.Id}",
            OriginalTitle = detail.OriginalTitle,
            Year = year,
            Overview = string.IsNullOrWhiteSpace(detail.Overview) ? null : detail.Overview,
            Rating = detail.VoteAverage,
            PosterUrl = BuildImageUrl(detail.PosterPath),
            BackdropUrl = BuildImageUrl(detail.BackdropPath),
            PlatformUrl = BuildPlatformUrl(detail.Id),
            Language = detail.OriginalLanguage,
            Country = detail.ProductionCountries.FirstOrDefault()?.Name,
            Genres = detail.Genres.Select(g => g.Name).ToList(),
            Keywords = detail.Keywords?.Keywords.Select(k => k.Name).ToList() ?? [],
            Directors = directors,
            Crew = crew,
            Cast = cast
        };
    }

    private static CrewRole? MapCrewRole(string job) => job switch
    {
        "Original Music Composer" or "Music" => CrewRole.Composer,
        "Screenplay" or "Writer" or "Story" => CrewRole.Writer,
        "Producer" => CrewRole.Producer,
        _ => null
    };

    private string? BuildImageUrl(string? path) =>
        string.IsNullOrWhiteSpace(path) ? null : $"{options.Value.ImageBaseUrl}/w500{path}";

    // I profili persona su TMDb supportano solo le taglie w45/w185/h632/original (non w500): usiamo w185,
    // sufficiente per un avatar e valida per questo tipo di immagine.
    private string? BuildProfileImageUrl(string? path) =>
        string.IsNullOrWhiteSpace(path) ? null : $"{options.Value.ImageBaseUrl}/w185{path}";

    private static string BuildPlatformUrl(int tmdbId) => $"https://www.themoviedb.org/movie/{tmdbId}";

    private static int? ExtractTmdbId(string url)
    {
        var segments = url.TrimEnd('/').Split('/');
        var lastSegment = segments.LastOrDefault();
        return int.TryParse(lastSegment, out var id) ? id : null;
    }
}

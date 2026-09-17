using System.Globalization;
using Microsoft.Extensions.Options;
using CineVector.Application.Crawling;
using CineVector.Domain.Enums;

namespace CineVector.Infrastructure.Sources.Omdb;

/// <summary>Adapter per OMDb (http://omdbapi.com/), un wrapper pubblico sui dati IMDb. A differenza di TMDb, OMDb
/// espone solo ricerca per titolo (nessun "popolari" e nessuna ricerca per persona): l'URL "scoperto" e restituito
/// come PlatformUrl è sempre la pagina pubblica IMDb del film, mai un player o uno stream.</summary>
public class OmdbSourceAdapter(OmdbApiClient client, IOptions<OmdbOptions> options) : ISourceAdapter
{
    public string Name => "Omdb";

    public Task<IReadOnlyCollection<string>> DiscoverMovieUrlsAsync(CrawlQuery query, CancellationToken cancellationToken) =>
        query.Mode switch
        {
            CrawlQueryMode.Title => DiscoverByTitleAsync(RequireQuery(query), cancellationToken),
            _ => throw new NotSupportedException($"Criterio di ricerca '{query.Mode}' non supportato da OMDb.")
        };

    private static string RequireQuery(CrawlQuery query) =>
        string.IsNullOrWhiteSpace(query.Query)
            ? throw new InvalidOperationException($"Il criterio '{query.Mode}' richiede un valore di ricerca.")
            : query.Query;

    /// <summary>OMDb pagina i risultati di /?s= a 10 per pagina; si ferma a MaxSearchPages o quando i risultati
    /// dichiarati in totalResults sono esauriti, quale delle due condizioni si verifichi prima.</summary>
    private async Task<IReadOnlyCollection<string>> DiscoverByTitleAsync(string title, CancellationToken ct)
    {
        var urls = new List<string>();
        var totalResults = int.MaxValue;

        for (var page = 1; page <= options.Value.MaxSearchPages && (page - 1) * 10 < totalResults; page++)
        {
            var response = await client.SearchAsync(title, page, ct);
            if (response is null || response.Search.Count == 0)
            {
                break;
            }

            urls.AddRange(response.Search.Select(r => BuildPlatformUrl(r.ImdbId)));

            if (!int.TryParse(response.TotalResults, out totalResults))
            {
                break;
            }
        }

        return urls;
    }

    public async Task<MovieMetadata?> ExtractMovieMetadataAsync(string url, CancellationToken cancellationToken)
    {
        var imdbId = ExtractImdbId(url);
        if (imdbId is null)
        {
            return null;
        }

        var detail = await client.GetByIdAsync(imdbId, cancellationToken);
        if (detail is null)
        {
            return null;
        }

        return new MovieMetadata
        {
            ExternalId = detail.ImdbId ?? imdbId,
            Title = detail.Title ?? $"OMDb #{imdbId}",
            Year = ParseYear(detail.Year),
            Overview = string.IsNullOrWhiteSpace(detail.Plot) ? null : detail.Plot,
            Rating = ParseRating(detail.ImdbRating),
            PosterUrl = NullIfNotAvailable(detail.Poster),
            BackdropUrl = null,
            PlatformUrl = BuildPlatformUrl(detail.ImdbId ?? imdbId),
            Language = SplitList(detail.Language).FirstOrDefault(),
            Country = SplitList(detail.Country).FirstOrDefault(),
            Genres = SplitList(detail.Genre),
            Directors = SplitList(detail.Director).Select(name => new MoviePersonRef(name)).ToList(),
            Crew = SplitList(detail.Writer)
                .Select(name => new MovieCrewMemberMetadata(name, CrewRole.Writer))
                .ToList(),
            Cast = SplitList(detail.Actors)
                .Select((name, index) => new MovieCastMemberMetadata(name, Character: null, BillingOrder: index))
                .ToList()
        };
    }

    private static int? ParseYear(string? year)
    {
        if (string.IsNullOrWhiteSpace(year) || year.Length < 4)
        {
            return null;
        }

        return int.TryParse(year[..4], out var parsed) ? parsed : null;
    }

    private static double? ParseRating(string? imdbRating) =>
        double.TryParse(imdbRating, NumberStyles.Float, CultureInfo.InvariantCulture, out var rating) ? rating : null;

    private static string? NullIfNotAvailable(string? value) =>
        string.IsNullOrWhiteSpace(value) || value == "N/A" ? null : value;

    private static IReadOnlyCollection<string> SplitList(string? value) =>
        NullIfNotAvailable(value)?
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            ?? [];

    private static string BuildPlatformUrl(string imdbId) => $"https://www.imdb.com/title/{imdbId}/";

    private static string? ExtractImdbId(string url) =>
        url.TrimEnd('/').Split('/').LastOrDefault(segment => segment.StartsWith("tt", StringComparison.Ordinal));
}

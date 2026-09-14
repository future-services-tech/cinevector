using System.Diagnostics;
using Microsoft.Extensions.Logging;
using CineVector.Application.Embeddings;
using CineVector.Application.Observability;
using CineVector.Application.Search;
using CineVector.Contracts.Search;
using CineVector.Domain.Entities;
using CineVector.Search.NaturalLanguage;

namespace CineVector.Search;

public class MovieSearchService(
    IMovieSearchRepository repository,
    ISearchRankingService rankingService,
    IEmbeddingService embeddingService,
    ISearchIntentParser intentParser,
    ISearchLogRepository searchLogRepository,
    ILogger<MovieSearchService> logger)
{
    public async Task<SearchResponse> SearchAsync(SearchRequest request, CancellationToken ct)
    {
        var stopwatch = Stopwatch.StartNew();
        var response = await ExecuteSearchAsync(request, ct);
        stopwatch.Stop();

        SearchMetrics.SearchDuration.Record(stopwatch.Elapsed.TotalMilliseconds, new KeyValuePair<string, object?>("mode", response.Mode));
        SearchMetrics.SearchRequests.Add(1, new KeyValuePair<string, object?>("mode", response.Mode));

        try
        {
            await searchLogRepository.AddAsync(new SearchLog
            {
                Query = response.Query,
                Mode = response.Mode,
                ResultCount = response.Total,
                DurationMs = stopwatch.Elapsed.TotalMilliseconds,
                CreatedAt = DateTimeOffset.UtcNow
            }, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Scrittura SearchLog fallita (non blocca la risposta di ricerca)");
        }

        return response;
    }

    private async Task<SearchResponse> ExecuteSearchAsync(SearchRequest request, CancellationToken ct)
    {
        request.Page = request.Page < 1 ? 1 : request.Page;
        request.PageSize = request.PageSize is < 1 or > 100 ? 20 : request.PageSize;

        if (request.NaturalLanguage && !string.IsNullOrWhiteSpace(request.Query))
        {
            ApplyNaturalLanguageIntent(request);
        }

        var hasTextQuery = !string.IsNullOrWhiteSpace(request.Query);
        var hasStructuredFilters = request.Genres.Count > 0 || request.Actors.Count > 0 || request.Directors.Count > 0
            || request.YearFrom.HasValue || request.YearTo.HasValue || request.RatingFrom.HasValue || request.RatingTo.HasValue
            || !string.IsNullOrWhiteSpace(request.Language) || !string.IsNullOrWhiteSpace(request.Country);

        IReadOnlyCollection<MovieSearchRow> rows;
        int total;
        SearchFacetsDto facets;
        var semanticActive = false;

        if (request.Semantic && hasTextQuery)
        {
            float[]? queryEmbedding = null;
            try
            {
                queryEmbedding = await embeddingService.GenerateAsync(request.Query!, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex,
                    "Generazione embedding fallita per la query '{Query}': fallback a ricerca full-text/strutturata", request.Query);
            }

            if (queryEmbedding is not null)
            {
                semanticActive = true;
                (rows, total) = await repository.SemanticSearchAsync(request, queryEmbedding, ct);
                facets = await repository.GetFacetsAsync(request, structuredOnly: true, ct);
            }
            else
            {
                (rows, total) = await repository.SearchAsync(request, ct);
                facets = await repository.GetFacetsAsync(request, structuredOnly: false, ct);
            }
        }
        else
        {
            (rows, total) = await repository.SearchAsync(request, ct);
            facets = await repository.GetFacetsAsync(request, structuredOnly: false, ct);
        }

        var mode = (semanticActive, hasTextQuery, hasStructuredFilters) switch
        {
            (true, _, true) => "semantic+structured",
            (true, _, false) => "semantic",
            (false, true, true) => "fulltext+structured",
            (false, true, false) => "fulltext",
            _ => "structured"
        };

        var results = rows.Select(row =>
        {
            var normalizedFullText = NormalizeFullTextScore(row.FullTextScore);
            var metadataScore = row.Rating.HasValue ? row.Rating.Value / 10.0 : (double?)null;
            var relevance = rankingService.ComputeScore(new RankingSignals(normalizedFullText, row.Similarity, metadataScore));
            var hasAnySignal = normalizedFullText.HasValue || row.Similarity.HasValue || metadataScore.HasValue;

            return new SearchResultItemDto
            {
                Id = row.Id,
                Title = row.Title,
                OriginalTitle = row.OriginalTitle,
                Year = row.Year,
                Rating = row.Rating,
                PosterUrl = row.PosterUrl,
                Genres = row.Genres,
                Relevance = hasAnySignal ? relevance : null,
                Similarity = row.Similarity
            };
        }).ToList();

        return new SearchResponse
        {
            Query = request.Query,
            Mode = mode,
            Total = total,
            Page = request.Page,
            PageSize = request.PageSize,
            Results = results,
            Facets = facets
        };
    }

    /// <summary>Applica l'intento estratto dal parser NL alla richiesta, senza sovrascrivere filtri già espliciti
    /// (es. genres passati dal client), e riduce Query al testo libero residuo.</summary>
    private void ApplyNaturalLanguageIntent(SearchRequest request)
    {
        var intent = intentParser.Parse(request.Query!);

        if (request.Genres.Count == 0 && intent.Genres.Count > 0) request.Genres = intent.Genres;
        if (request.Actors.Count == 0 && intent.Actors.Count > 0) request.Actors = intent.Actors;
        if (request.Directors.Count == 0 && intent.Directors.Count > 0) request.Directors = intent.Directors;
        if (request.YearFrom is null) request.YearFrom = intent.YearFrom;
        if (request.YearTo is null) request.YearTo = intent.YearTo;
        if (request.RatingFrom is null) request.RatingFrom = intent.RatingMin;
        if (string.IsNullOrWhiteSpace(request.Country)) request.Country = intent.Country;

        request.Query = intent.TextQuery;
        request.Semantic = intent.Semantic;
    }

    /// <summary>ts_rank non è vincolato a [0,1]; per una combinazione pesata prevedibile lo comprimiamo con una funzione a saturazione invece di un clamp lineare arbitrario.</summary>
    private static double? NormalizeFullTextScore(double? rawRank) =>
        rawRank is { } rank ? rank / (rank + 0.1) : null;
}

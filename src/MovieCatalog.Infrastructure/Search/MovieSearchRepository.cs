using Microsoft.EntityFrameworkCore;
using MovieCatalog.Application.Common;
using MovieCatalog.Application.Observability;
using MovieCatalog.Application.Search;
using MovieCatalog.Contracts.Search;
using MovieCatalog.Domain.Entities;
using MovieCatalog.Infrastructure.Persistence;
using NpgsqlTypes;
using Pgvector;

namespace MovieCatalog.Infrastructure.Search;

public class MovieSearchRepository(AppDbContext db) : IMovieSearchRepository
{
    private const int FacetTopN = 20;

    public async Task<(IReadOnlyCollection<MovieSearchRow> Items, int Total)> SearchAsync(SearchRequest request, CancellationToken ct)
    {
        using var _ = DbMetrics.Measure("MovieSearchRepository.SearchAsync");

        var filtered = BuildFilteredQuery(request);
        var total = await filtered.CountAsync(ct);

        var hasQuery = !string.IsNullOrWhiteSpace(request.Query);
        List<MovieSearchRow> items;

        if (hasQuery)
        {
            var queryText = request.Query!;

            var projected = filtered.Select(m => new
            {
                m.Id,
                m.Title,
                m.OriginalTitle,
                m.Year,
                m.Rating,
                m.PosterUrl,
                Genres = m.Genres.Select(g => g.Genre!.Name).ToList(),
                Rank = EF.Property<NpgsqlTsVector>(m, AppDbContext.SearchVectorProperty)
                    .Rank(EF.Functions.WebSearchToTsQuery("simple", queryText))
            });

            projected = request.Sort switch
            {
                SearchSort.YearDesc => projected.OrderByDescending(m => m.Year ?? int.MinValue),
                SearchSort.YearAsc => projected.OrderBy(m => m.Year ?? int.MaxValue),
                SearchSort.RatingDesc => projected.OrderByDescending(m => m.Rating ?? double.MinValue),
                SearchSort.TitleAsc => projected.OrderBy(m => m.Title),
                _ => projected.OrderByDescending(m => m.Rank)
            };

            var rows = await projected.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToListAsync(ct);
            items = rows.Select(r => new MovieSearchRow(r.Id, r.Title, r.OriginalTitle, r.Year, r.Rating, r.PosterUrl, r.Genres, (double)r.Rank)).ToList();
        }
        else
        {
            var projected = filtered.Select(m => new
            {
                m.Id,
                m.Title,
                m.OriginalTitle,
                m.Year,
                m.Rating,
                m.PosterUrl,
                Genres = m.Genres.Select(g => g.Genre!.Name).ToList(),
                m.CreatedAt
            });

            projected = request.Sort switch
            {
                SearchSort.YearDesc => projected.OrderByDescending(m => m.Year ?? int.MinValue),
                SearchSort.YearAsc => projected.OrderBy(m => m.Year ?? int.MaxValue),
                SearchSort.RatingDesc => projected.OrderByDescending(m => m.Rating ?? double.MinValue),
                SearchSort.TitleAsc => projected.OrderBy(m => m.Title),
                _ => projected.OrderByDescending(m => m.CreatedAt)
            };

            var rows = await projected.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToListAsync(ct);
            items = rows.Select(r => new MovieSearchRow(r.Id, r.Title, r.OriginalTitle, r.Year, r.Rating, r.PosterUrl, r.Genres, null)).ToList();
        }

        return (items, total);
    }

    public async Task<(IReadOnlyCollection<MovieSearchRow> Items, int Total)> SemanticSearchAsync(
        SearchRequest request, float[] queryEmbedding, CancellationToken ct)
    {
        using var _ = DbMetrics.Measure("MovieSearchRepository.SemanticSearchAsync");

        var eligibleIds = await BuildStructuredFilterQuery(request).Select(m => m.Id).ToListAsync(ct);
        if (eligibleIds.Count == 0)
        {
            return ([], 0);
        }

        var idsArray = eligibleIds.ToArray();
        var vector = new Vector(queryEmbedding);

        var total = await db.Movies.CountAsync(m => idsArray.Contains(m.Id) && m.Embedding != null, ct);

        var offset = (request.Page - 1) * request.PageSize;
        var rawRows = await db.Database.SqlQuery<SemanticRow>($"""
            SELECT m."Id" AS "Id", m."Title" AS "Title", m."OriginalTitle" AS "OriginalTitle", m."Year" AS "Year",
                   m."Rating" AS "Rating", m."PosterUrl" AS "PosterUrl",
                   1 - (m."Embedding" <=> {vector}) AS "Similarity"
            FROM movies m
            WHERE m."Id" = ANY({idsArray}) AND m."Embedding" IS NOT NULL
            ORDER BY m."Embedding" <=> {vector}
            OFFSET {offset} LIMIT {request.PageSize}
            """).ToListAsync(ct);

        var genreLookup = await LoadGenresByMovieAsync(rawRows.Select(r => r.Id).ToList(), ct);

        var items = rawRows.Select(r => new MovieSearchRow(
            r.Id, r.Title, r.OriginalTitle, r.Year, r.Rating, r.PosterUrl,
            genreLookup.GetValueOrDefault(r.Id, []),
            FullTextScore: null,
            Similarity: r.Similarity)).ToList();

        return (items, total);
    }

    private record SemanticRow(int Id, string Title, string? OriginalTitle, int? Year, double? Rating, string? PosterUrl, double Similarity);

    public async Task<MovieEmbeddingProfile?> GetEmbeddingProfileAsync(int movieId, CancellationToken ct)
    {
        var profile = await db.Movies
            .Where(m => m.Id == movieId && m.Embedding != null)
            .Select(m => new { m.Embedding, m.Year, Genres = m.Genres.Select(g => g.Genre!.Name).ToList() })
            .FirstOrDefaultAsync(ct);

        return profile is null ? null : new MovieEmbeddingProfile(profile.Embedding!, profile.Year, profile.Genres);
    }

    public async Task<IReadOnlyCollection<MovieSearchRow>> FindSimilarByEmbeddingAsync(
        int excludeMovieId, float[] embedding, int limit, CancellationToken ct)
    {
        var vector = new Vector(embedding);

        var rawRows = await db.Database.SqlQuery<SemanticRow>($"""
            SELECT m."Id" AS "Id", m."Title" AS "Title", m."OriginalTitle" AS "OriginalTitle", m."Year" AS "Year",
                   m."Rating" AS "Rating", m."PosterUrl" AS "PosterUrl",
                   1 - (m."Embedding" <=> {vector}) AS "Similarity"
            FROM movies m
            WHERE m."Id" != {excludeMovieId} AND m."Embedding" IS NOT NULL
            ORDER BY m."Embedding" <=> {vector}
            LIMIT {limit}
            """).ToListAsync(ct);

        var genreLookup = await LoadGenresByMovieAsync(rawRows.Select(r => r.Id).ToList(), ct);

        return rawRows.Select(r => new MovieSearchRow(
            r.Id, r.Title, r.OriginalTitle, r.Year, r.Rating, r.PosterUrl,
            genreLookup.GetValueOrDefault(r.Id, []),
            FullTextScore: null,
            Similarity: r.Similarity)).ToList();
    }

    private async Task<Dictionary<int, IReadOnlyCollection<string>>> LoadGenresByMovieAsync(List<int> movieIds, CancellationToken ct)
    {
        var genresByMovie = await db.Set<MovieGenre>()
            .Where(mg => movieIds.Contains(mg.MovieId))
            .Select(mg => new { mg.MovieId, GenreName = mg.Genre!.Name })
            .ToListAsync(ct);

        return genresByMovie
            .GroupBy(x => x.MovieId)
            .ToDictionary(g => g.Key, g => (IReadOnlyCollection<string>)g.Select(x => x.GenreName).ToList());
    }

    public async Task<SearchFacetsDto> GetFacetsAsync(SearchRequest request, bool structuredOnly, CancellationToken ct)
    {
        using var _ = DbMetrics.Measure("MovieSearchRepository.GetFacetsAsync");

        var filtered = structuredOnly ? BuildStructuredFilterQuery(request) : BuildFilteredQuery(request);

        var genres = await filtered
            .SelectMany(m => m.Genres.Select(g => g.Genre!.Name))
            .GroupBy(name => name)
            .Select(g => new FacetValueDto { Value = g.Key, Count = g.Count() })
            .OrderByDescending(f => f.Count)
            .Take(FacetTopN)
            .ToListAsync(ct);

        var years = await filtered
            .Where(m => m.Year != null)
            .GroupBy(m => m.Year!.Value)
            .Select(g => new FacetValueDto { Value = g.Key.ToString(), Count = g.Count() })
            .OrderByDescending(f => f.Value)
            .Take(FacetTopN)
            .ToListAsync(ct);

        var languages = await filtered
            .Where(m => m.Language != null)
            .GroupBy(m => m.Language!)
            .Select(g => new FacetValueDto { Value = g.Key, Count = g.Count() })
            .OrderByDescending(f => f.Count)
            .Take(FacetTopN)
            .ToListAsync(ct);

        return new SearchFacetsDto { Genres = genres, Years = years, Languages = languages };
    }

    private IQueryable<Movie> BuildFilteredQuery(SearchRequest request)
    {
        var query = BuildStructuredFilterQuery(request);

        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var queryText = request.Query;
            query = query.Where(m => EF.Property<NpgsqlTsVector>(m, AppDbContext.SearchVectorProperty)
                .Matches(EF.Functions.WebSearchToTsQuery("simple", queryText)));
        }

        return query;
    }

    /// <summary>Solo i filtri strutturati (genere/attore/regista/anno/rating/lingua), senza corrispondenza full-text:
    /// usata sia per il ramo lessicale (a cui poi si aggiunge il filtro testuale) sia per restringere il candidate set
    /// della ricerca semantica, dove il testo non va confrontato lessicalmente ma tradotto in un embedding.</summary>
    private IQueryable<Movie> BuildStructuredFilterQuery(SearchRequest request)
    {
        var query = db.Movies.AsQueryable();

        if (request.YearFrom.HasValue) query = query.Where(m => m.Year >= request.YearFrom);
        if (request.YearTo.HasValue) query = query.Where(m => m.Year <= request.YearTo);
        if (request.RatingFrom.HasValue) query = query.Where(m => m.Rating >= request.RatingFrom);
        if (request.RatingTo.HasValue) query = query.Where(m => m.Rating <= request.RatingTo);
        if (!string.IsNullOrWhiteSpace(request.Language)) query = query.Where(m => m.Language == request.Language);
        if (!string.IsNullOrWhiteSpace(request.Country))
        {
            var countryPattern = $"%{request.Country}%";
            query = query.Where(m => m.Country != null && EF.Functions.ILike(m.Country, countryPattern));
        }

        if (request.Genres.Count > 0)
        {
            var normalized = request.Genres.Select(TextNormalizer.Normalize).ToList();
            query = query.Where(m => m.Genres.Any(g => normalized.Contains(g.Genre!.NormalizedName)));
        }

        if (request.Actors.Count > 0)
        {
            var normalized = request.Actors.Select(TextNormalizer.Normalize).ToList();
            query = query.Where(m => m.Cast.Any(c => normalized.Contains(c.Person!.NormalizedName)));
        }

        if (request.Directors.Count > 0)
        {
            var normalized = request.Directors.Select(TextNormalizer.Normalize).ToList();
            query = query.Where(m => m.Directors.Any(d => normalized.Contains(d.Person!.NormalizedName)));
        }

        return query;
    }
}

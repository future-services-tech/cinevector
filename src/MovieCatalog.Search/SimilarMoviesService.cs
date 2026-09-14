using Microsoft.Extensions.Options;
using MovieCatalog.Application.Search;
using MovieCatalog.Contracts.Search;

namespace MovieCatalog.Search;

/// <summary>Trova film simili per similarità coseno sull'embedding, con un piccolo re-ranking basato su generi
/// condivisi e vicinanza d'anno (Sezione 13). I pesi sono configurabili; a differenza del ranking ibrido di ricerca,
/// qui non c'è una query testuale da bilanciare, quindi la combinazione è additiva e non richiede rinormalizzazione.</summary>
public class SimilarMoviesService(IMovieSearchRepository repository, IOptions<SimilarMoviesOptions> options)
{
    public async Task<SimilarMoviesResponse?> GetSimilarAsync(
        int movieId, int? maxResults, double? minSimilarity, CancellationToken ct)
    {
        var profile = await repository.GetEmbeddingProfileAsync(movieId, ct);
        if (profile is null)
        {
            return null;
        }

        var opts = options.Value;
        var effectiveMax = maxResults is > 0 and <= 100 ? maxResults.Value : opts.MaxResults;
        var effectiveMinSimilarity = minSimilarity ?? opts.MinSimilarity;

        var candidates = await repository.FindSimilarByEmbeddingAsync(movieId, profile.Embedding, effectiveMax * 3, ct);

        var results = candidates
            .Select(c => new { Row = c, Score = ComputeAdjustedScore(c, profile, opts) })
            .Where(x => (x.Row.Similarity ?? 0) >= effectiveMinSimilarity)
            .OrderByDescending(x => x.Score)
            .Take(effectiveMax)
            .Select(x => new SearchResultItemDto
            {
                Id = x.Row.Id,
                Title = x.Row.Title,
                OriginalTitle = x.Row.OriginalTitle,
                Year = x.Row.Year,
                Rating = x.Row.Rating,
                PosterUrl = x.Row.PosterUrl,
                Genres = x.Row.Genres,
                Similarity = x.Row.Similarity,
                Relevance = x.Score
            })
            .ToList();

        return new SimilarMoviesResponse { MovieId = movieId, Results = results };
    }

    private static double ComputeAdjustedScore(MovieSearchRow candidate, MovieEmbeddingProfile target, SimilarMoviesOptions opts)
    {
        var score = candidate.Similarity ?? 0;

        if (target.Genres.Count > 0)
        {
            var shared = candidate.Genres.Intersect(target.Genres, StringComparer.OrdinalIgnoreCase).Count();
            score += opts.GenreWeight * ((double)shared / target.Genres.Count);
        }

        if (target.Year.HasValue && candidate.Year.HasValue && opts.YearDecayRange > 0)
        {
            var distance = Math.Abs(candidate.Year.Value - target.Year.Value);
            var proximity = Math.Max(0, 1 - (double)distance / opts.YearDecayRange);
            score += opts.YearWeight * proximity;
        }

        return score;
    }
}

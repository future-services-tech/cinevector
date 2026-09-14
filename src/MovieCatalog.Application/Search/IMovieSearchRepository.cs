using MovieCatalog.Contracts.Search;

namespace MovieCatalog.Application.Search;

public record MovieSearchRow(
    int Id,
    string Title,
    string? OriginalTitle,
    int? Year,
    double? Rating,
    string? PosterUrl,
    IReadOnlyCollection<string> Genres,
    double? FullTextScore,
    double? Similarity = null);

public record MovieEmbeddingProfile(float[] Embedding, int? Year, IReadOnlyCollection<string> Genres);

public interface IMovieSearchRepository
{
    /// <summary>Embedding, anno e generi del film usato come riferimento per "film simili". Null se il film
    /// non esiste o non ha ancora un embedding calcolato.</summary>
    Task<MovieEmbeddingProfile?> GetEmbeddingProfileAsync(int movieId, CancellationToken ct);

    /// <summary>Film più simili per coseno all'embedding indicato, escluso il film di riferimento stesso.</summary>
    Task<IReadOnlyCollection<MovieSearchRow>> FindSimilarByEmbeddingAsync(int excludeMovieId, float[] embedding, int limit, CancellationToken ct);

    Task<(IReadOnlyCollection<MovieSearchRow> Items, int Total)> SearchAsync(SearchRequest request, CancellationToken ct);

    /// <summary>Ricerca per similarità coseno sull'embedding, ristretta ai film che soddisfano i filtri strutturati
    /// (genere/attore/regista/anno/rating/lingua) e che hanno già un vettore calcolato.</summary>
    Task<(IReadOnlyCollection<MovieSearchRow> Items, int Total)> SemanticSearchAsync(SearchRequest request, float[] queryEmbedding, CancellationToken ct);

    /// <summary>Se <paramref name="structuredOnly"/> è true, i facet sono calcolati sui soli filtri strutturati
    /// (usato in modalità semantica, dove il testo non è confrontato lessicalmente).</summary>
    Task<SearchFacetsDto> GetFacetsAsync(SearchRequest request, bool structuredOnly, CancellationToken ct);
}

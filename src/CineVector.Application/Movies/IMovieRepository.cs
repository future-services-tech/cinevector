using CineVector.Domain.Entities;

namespace CineVector.Application.Movies;

public interface IMovieRepository
{
    Task<Movie?> GetByIdAsync(int id, CancellationToken ct);
    Task<Movie?> GetBySourceAndExternalIdAsync(int sourceId, string externalId, CancellationToken ct);
    Task<(IReadOnlyCollection<Movie> Items, int Total)> GetPagedAsync(int page, int pageSize, CancellationToken ct);

    /// <summary>Film con testo di embedding aggiornato ma senza vettore calcolato (mai generato, o invalidato da una modifica ai metadati).</summary>
    Task<IReadOnlyCollection<Movie>> GetMoviesPendingEmbeddingAsync(int limit, CancellationToken ct);
    Task<Source> GetOrCreateSourceAsync(string sourceName, CancellationToken ct);
    Task<Genre> GetOrCreateGenreAsync(string name, CancellationToken ct);
    Task<Person> GetOrCreatePersonAsync(string name, CancellationToken ct);
    Task<Keyword> GetOrCreateKeywordAsync(string name, CancellationToken ct);

    /// <summary>Cerca, tra le fonti diverse da <paramref name="excludingSourceId"/>, un film con titolo normalizzato
    /// e anno coincidenti. Usato per segnalare (non unire automaticamente) possibili duplicati cross-source.</summary>
    Task<Movie?> FindPotentialDuplicateAsync(string title, int? year, int excludingSourceId, CancellationToken ct);

    void Add(Movie movie);
    void Remove(Movie movie);
    Task SaveChangesAsync(CancellationToken ct);
}

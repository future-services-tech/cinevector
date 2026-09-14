using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Application.Search;

public interface ISearchLogRepository
{
    Task AddAsync(SearchLog log, CancellationToken ct);
    Task<IReadOnlyCollection<SearchLog>> GetSinceAsync(DateTimeOffset since, CancellationToken ct);
}

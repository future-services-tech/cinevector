using CineVector.Domain.Entities;

namespace CineVector.Application.Search;

public interface ISearchLogRepository
{
    Task AddAsync(SearchLog log, CancellationToken ct);
    Task<IReadOnlyCollection<SearchLog>> GetSinceAsync(DateTimeOffset since, CancellationToken ct);
}

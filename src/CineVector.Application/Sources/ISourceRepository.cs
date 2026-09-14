using CineVector.Domain.Entities;

namespace CineVector.Application.Sources;

public interface ISourceRepository
{
    Task<Source?> GetByIdAsync(int id, CancellationToken ct);
    Task<IReadOnlyCollection<Source>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyCollection<Source>> GetEnabledAsync(CancellationToken ct);
    void Add(Source source);
    void Remove(Source source);
    Task UpdateLastCrawlAsync(int sourceId, DateTimeOffset when, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}

using Microsoft.EntityFrameworkCore;
using CineVector.Application.Search;
using CineVector.Domain.Entities;
using CineVector.Infrastructure.Persistence;

namespace CineVector.Infrastructure.Search;

public class SearchLogRepository(AppDbContext db) : ISearchLogRepository
{
    public async Task AddAsync(SearchLog log, CancellationToken ct)
    {
        db.SearchLogs.Add(log);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyCollection<SearchLog>> GetSinceAsync(DateTimeOffset since, CancellationToken ct) =>
        await db.SearchLogs.Where(l => l.CreatedAt >= since).OrderByDescending(l => l.CreatedAt).ToListAsync(ct);
}

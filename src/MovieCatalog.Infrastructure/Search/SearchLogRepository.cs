using Microsoft.EntityFrameworkCore;
using MovieCatalog.Application.Search;
using MovieCatalog.Domain.Entities;
using MovieCatalog.Infrastructure.Persistence;

namespace MovieCatalog.Infrastructure.Search;

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

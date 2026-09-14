using Microsoft.EntityFrameworkCore;
using CineVector.Application.Sources;
using CineVector.Domain.Entities;
using CineVector.Infrastructure.Persistence;

namespace CineVector.Infrastructure.Sources;

public class SourceRepository(AppDbContext db) : ISourceRepository
{
    public Task<Source?> GetByIdAsync(int id, CancellationToken ct) =>
        db.Sources.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<IReadOnlyCollection<Source>> GetAllAsync(CancellationToken ct) =>
        await db.Sources.OrderBy(s => s.Name).ToListAsync(ct);

    public async Task<IReadOnlyCollection<Source>> GetEnabledAsync(CancellationToken ct) =>
        await db.Sources.Where(s => s.Enabled).OrderBy(s => s.Name).ToListAsync(ct);

    public void Add(Source source) => db.Sources.Add(source);

    public void Remove(Source source) => db.Sources.Remove(source);

    public async Task UpdateLastCrawlAsync(int sourceId, DateTimeOffset when, CancellationToken ct)
    {
        var source = await db.Sources.FirstOrDefaultAsync(s => s.Id == sourceId, ct);
        if (source is not null)
        {
            source.LastCrawlAt = when;
        }
    }

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}

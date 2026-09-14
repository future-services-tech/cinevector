using Microsoft.EntityFrameworkCore;
using CineVector.Application.Crawling;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;
using CineVector.Infrastructure.Persistence;

namespace CineVector.Infrastructure.Crawling;

public class CrawlJobRepository(AppDbContext db) : ICrawlJobRepository
{
    public async Task<CrawlJob> CreateAsync(int sourceId, CrawlQuery query, CancellationToken ct)
    {
        var job = new CrawlJob
        {
            SourceId = sourceId,
            StartedAt = DateTimeOffset.UtcNow,
            Status = CrawlJobStatus.Running,
            QueryMode = query.Mode,
            Query = query.Query
        };

        db.CrawlJobs.Add(job);
        await db.SaveChangesAsync(ct);
        return job;
    }

    public Task<CrawlJob?> GetByIdAsync(int id, CancellationToken ct) =>
        db.CrawlJobs.Include(j => j.Source).Include(j => j.Errors).FirstOrDefaultAsync(j => j.Id == id, ct);

    public async Task<IReadOnlyCollection<CrawlJob>> GetRecentAsync(int take, CancellationToken ct) =>
        await db.CrawlJobs.Include(j => j.Source).Include(j => j.Errors)
            .OrderByDescending(j => j.StartedAt).Take(take).ToListAsync(ct);

    public Task<CrawlJob?> GetLatestRunningBySourceAsync(int sourceId, CancellationToken ct) =>
        db.CrawlJobs
            .Where(j => j.SourceId == sourceId && j.Status == CrawlJobStatus.Running)
            .OrderByDescending(j => j.StartedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddErrorAsync(int crawlJobId, string url, string errorType, string message, CancellationToken ct)
    {
        db.CrawlErrors.Add(new CrawlError
        {
            CrawlJobId = crawlJobId,
            Url = url.Length > 2000 ? url[..2000] : url,
            ErrorType = errorType.Length > 200 ? errorType[..200] : errorType,
            Message = message.Length > 4000 ? message[..4000] : message,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    public void ResetTrackingKeepingJob(CrawlJob job)
    {
        db.ChangeTracker.Clear();
        db.CrawlJobs.Attach(job);
        db.Entry(job).State = EntityState.Modified;
    }
}

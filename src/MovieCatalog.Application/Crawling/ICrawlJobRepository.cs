using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Application.Crawling;

public interface ICrawlJobRepository
{
    Task<CrawlJob> CreateAsync(int sourceId, CrawlQuery query, CancellationToken ct);
    Task<CrawlJob?> GetByIdAsync(int id, CancellationToken ct);
    Task<IReadOnlyCollection<CrawlJob>> GetRecentAsync(int take, CancellationToken ct);
    Task<CrawlJob?> GetLatestRunningBySourceAsync(int sourceId, CancellationToken ct);
    Task AddErrorAsync(int crawlJobId, string url, string errorType, string message, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);

    /// <summary>Da chiamare quando una SaveChangesAsync fallisce (es. vincolo di unicità sui metadati di un film)
    /// e si vuole continuare il job: scarta tutte le entità tracciate (altrimenti l'errore si ripeterebbe a ogni
    /// salvataggio successivo, incluso quello finale che marca il job) mantenendo tracciato solo <paramref name="job"/>,
    /// così i contatori già aggiornati in memoria vengono comunque persistiti.</summary>
    void ResetTrackingKeepingJob(CrawlJob job);
}

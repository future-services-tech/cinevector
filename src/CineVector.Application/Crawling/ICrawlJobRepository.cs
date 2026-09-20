using CineVector.Domain.Entities;
using CineVector.Domain.Enums;

namespace CineVector.Application.Crawling;

public interface ICrawlJobRepository
{
    Task<CrawlJob> CreateAsync(int sourceId, CrawlQuery query, CancellationToken ct);
    Task<CrawlJob?> GetByIdAsync(int id, CancellationToken ct);
    Task<IReadOnlyCollection<CrawlJob>> GetRecentAsync(int take, CancellationToken ct);
    Task<CrawlJob?> GetLatestRunningBySourceAsync(int sourceId, CancellationToken ct);

    /// <summary>Trova un job Running/Paused per la stessa fonte che condivide esattamente lo stesso criterio
    /// di ricerca (QueryMode + Query): è la "stringa di chiamata" usata per decidere se un nuovo crawl è un
    /// duplicato da rifiutare o un criterio diverso legittimo da eseguire in parallelo sulla stessa fonte.</summary>
    Task<CrawlJob?> GetLatestActiveByCriteriaAsync(int sourceId, CrawlQueryMode mode, string? query, CancellationToken ct);
    Task AddErrorAsync(int crawlJobId, string url, string errorType, string message, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);

    /// <summary>Elimina definitivamente il job e i suoi errori (cascade su crawl_errors): nessuna traccia
    /// resta in DB, solo nei log applicativi di chi ha effettuato l'operazione. Restituisce false se il job non esiste.</summary>
    Task<bool> DeleteAsync(int id, CancellationToken ct);

    /// <summary>Da chiamare quando una SaveChangesAsync fallisce (es. vincolo di unicità sui metadati di un film)
    /// e si vuole continuare il job: scarta tutte le entità tracciate (altrimenti l'errore si ripeterebbe a ogni
    /// salvataggio successivo, incluso quello finale che marca il job) mantenendo tracciato solo <paramref name="job"/>,
    /// così i contatori già aggiornati in memoria vengono comunque persistiti.</summary>
    void ResetTrackingKeepingJob(CrawlJob job);
}

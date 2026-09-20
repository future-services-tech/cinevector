using System.Collections.Concurrent;

namespace CineVector.Application.Crawling;

/// <summary>Coordina cancellazione, pausa e visibilità di "chi sta davvero eseguendo" i CrawlJob in corso.
/// L'implementazione di produzione (<c>RedisCrawlCancellationRegistry</c> in Infrastructure) è condivisa tra
/// tutte le istanze API tramite Redis: un job avviato su un'istanza può essere fermato/messo in pausa da una
/// richiesta gestita da un'altra istanza, e <see cref="ContainsAsync"/> riflette se una QUALSIASI istanza lo sta
/// ancora eseguendo davvero (non solo quella che ha ricevuto la richiesta). Un job il cui Id non risulta
/// presente ma che in DB è ancora "Running"/"Paused" è per definizione orfano/zombie: nessuna istanza lo sta
/// eseguendo (crash, riavvio, deploy).</summary>
public interface ICrawlCancellationRegistry
{
    Task<CancellationToken> RegisterAsync(int crawlJobId, CancellationToken ct);
    Task<bool> TryCancelAsync(int crawlJobId, CancellationToken ct);
    Task RemoveAsync(int crawlJobId, CancellationToken ct);

    /// <summary>True se il job è gestito (vivo) su una qualsiasi istanza.</summary>
    Task<bool> ContainsAsync(int crawlJobId, CancellationToken ct);

    Task PauseAsync(int crawlJobId, CancellationToken ct);
    Task ResumeAsync(int crawlJobId, CancellationToken ct);
    Task<bool> IsPausedAsync(int crawlJobId, CancellationToken ct);
}

/// <summary>Variante puramente in-process (nessuna dipendenza esterna): non coordina nulla tra istanze diverse.
/// Usata come test double nei test di integrazione dei controller e come fallback se Redis non è configurato.</summary>
public class InMemoryCrawlCancellationRegistry : ICrawlCancellationRegistry
{
    private readonly ConcurrentDictionary<int, CancellationTokenSource> _tokens = new();
    private readonly ConcurrentDictionary<int, bool> _paused = new();

    public Task<CancellationToken> RegisterAsync(int crawlJobId, CancellationToken ct)
    {
        var cts = new CancellationTokenSource();
        _tokens[crawlJobId] = cts;
        return Task.FromResult(cts.Token);
    }

    public Task<bool> TryCancelAsync(int crawlJobId, CancellationToken ct)
    {
        if (_tokens.TryGetValue(crawlJobId, out var cts))
        {
            cts.Cancel();
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    public Task RemoveAsync(int crawlJobId, CancellationToken ct)
    {
        if (_tokens.TryRemove(crawlJobId, out var cts))
        {
            cts.Dispose();
        }

        _paused.TryRemove(crawlJobId, out _);
        return Task.CompletedTask;
    }

    public Task<bool> ContainsAsync(int crawlJobId, CancellationToken ct) => Task.FromResult(_tokens.ContainsKey(crawlJobId));

    public Task PauseAsync(int crawlJobId, CancellationToken ct)
    {
        _paused[crawlJobId] = true;
        return Task.CompletedTask;
    }

    public Task ResumeAsync(int crawlJobId, CancellationToken ct)
    {
        _paused.TryRemove(crawlJobId, out _);
        return Task.CompletedTask;
    }

    public Task<bool> IsPausedAsync(int crawlJobId, CancellationToken ct) => Task.FromResult(_paused.ContainsKey(crawlJobId));
}

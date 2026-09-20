using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using CineVector.Application.Crawling;

namespace CineVector.Infrastructure.Crawling;

/// <summary>Implementazione cross-istanza (via Redis) di <see cref="ICrawlCancellationRegistry"/>: un
/// <see cref="CancellationTokenSource"/> è per natura un oggetto di processo e non può essere "distribuito", ma
/// il SEGNALE di cancellazione/pausa sì. Ogni istanza che esegue un job registra in Redis una chiave di
/// ownership con TTL breve, rinnovata periodicamente (heartbeat) finché il job è in corso: se l'istanza muore
/// senza fare pulizia, la chiave scade da sola e <see cref="ContainsAsync"/> smette di vederla — è esattamente
/// il segnale che rende un job "orfano/zombie" rilevabile indipendentemente da quale istanza riceva la
/// richiesta. Cancel/pause impostano chiavi separate che l'istanza proprietaria interroga a ogni checkpoint
/// del loop di crawl (vedi CrawlerPipelineService), così una richiesta gestita da un'altra istanza arriva
/// comunque a destinazione entro un polling interval.</summary>
public class RedisCrawlCancellationRegistry(IConnectionMultiplexer redis, ILogger<RedisCrawlCancellationRegistry> logger)
    : ICrawlCancellationRegistry
{
    private static readonly TimeSpan OwnerTtl = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan HeartbeatInterval = TimeSpan.FromSeconds(5);

    private readonly ConcurrentDictionary<int, (CancellationTokenSource Cts, Task Watcher)> _owned = new();
    private readonly string _instanceId = $"{Environment.MachineName}:{Environment.ProcessId}";

    private IDatabase Db => redis.GetDatabase();

    private static RedisKey OwnerKey(int jobId) => $"crawl:owner:{jobId}";
    private static RedisKey CancelKey(int jobId) => $"crawl:cancel:{jobId}";
    private static RedisKey PauseKey(int jobId) => $"crawl:pause:{jobId}";

    public async Task<CancellationToken> RegisterAsync(int crawlJobId, CancellationToken ct)
    {
        var cts = new CancellationTokenSource();
        await Db.StringSetAsync(OwnerKey(crawlJobId), _instanceId, OwnerTtl);
        await Db.KeyDeleteAsync([CancelKey(crawlJobId), PauseKey(crawlJobId)]);

        var watcher = WatchAsync(crawlJobId, cts);
        _owned[crawlJobId] = (cts, watcher);
        return cts.Token;
    }

    /// <summary>Gira per tutta la durata del job su questa istanza: rinnova la TTL di ownership (heartbeat) e
    /// osserva il flag di cancellazione, propagandolo al CancellationTokenSource locale se qualcuno lo imposta
    /// (da questa o da un'altra istanza tramite <see cref="TryCancelAsync"/>).</summary>
    private async Task WatchAsync(int jobId, CancellationTokenSource cts)
    {
        try
        {
            while (!cts.IsCancellationRequested)
            {
                await Db.KeyExpireAsync(OwnerKey(jobId), OwnerTtl);

                if (await Db.KeyExistsAsync(CancelKey(jobId)))
                {
                    cts.Cancel();
                    break;
                }

                await Task.Delay(HeartbeatInterval, cts.Token);
            }
        }
        catch (OperationCanceledException)
        {
            // Cancellazione normale (RemoveAsync o TryCancelAsync in-process): nessun log, è il percorso atteso.
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Watcher Redis per il crawl job {JobId} terminato con un errore imprevisto", jobId);
        }
    }

    public async Task<bool> TryCancelAsync(int crawlJobId, CancellationToken ct)
    {
        var ownedLocally = _owned.TryGetValue(crawlJobId, out var entry);
        if (!ownedLocally && !await Db.KeyExistsAsync(OwnerKey(crawlJobId)))
        {
            return false;
        }

        await Db.StringSetAsync(CancelKey(crawlJobId), "1", OwnerTtl);
        if (ownedLocally)
        {
            entry.Cts.Cancel();
        }

        return true;
    }

    public async Task RemoveAsync(int crawlJobId, CancellationToken ct)
    {
        if (_owned.TryRemove(crawlJobId, out var entry))
        {
            entry.Cts.Cancel();
            entry.Cts.Dispose();
        }

        await Db.KeyDeleteAsync([OwnerKey(crawlJobId), CancelKey(crawlJobId), PauseKey(crawlJobId)]);
    }

    public Task<bool> ContainsAsync(int crawlJobId, CancellationToken ct) => Db.KeyExistsAsync(OwnerKey(crawlJobId));

    public Task PauseAsync(int crawlJobId, CancellationToken ct) => Db.StringSetAsync(PauseKey(crawlJobId), "1", OwnerTtl);

    public Task ResumeAsync(int crawlJobId, CancellationToken ct) => Db.KeyDeleteAsync(PauseKey(crawlJobId));

    public Task<bool> IsPausedAsync(int crawlJobId, CancellationToken ct) => Db.KeyExistsAsync(PauseKey(crawlJobId));
}

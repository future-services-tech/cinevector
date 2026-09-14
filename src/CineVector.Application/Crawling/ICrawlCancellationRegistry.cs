using System.Collections.Concurrent;

namespace CineVector.Application.Crawling;

/// <summary>Coordina cancellazione e pausa dei CrawlJob in esecuzione nel processo corrente. È una soluzione in-memory
/// adatta a una singola istanza API/Worker; il coordinamento cross-istanza (Redis) arriva in Fase 6. Un job il cui
/// Id non è (più) presente qui ma che in DB risulta ancora "Running"/"Paused" è per definizione orfano/zombie:
/// l'istanza che lo eseguiva non esiste più (crash, riavvio, deploy).</summary>
public interface ICrawlCancellationRegistry
{
    CancellationToken Register(int crawlJobId);
    bool TryCancel(int crawlJobId);
    void Remove(int crawlJobId);

    /// <summary>True se il job è gestito (vivo) in questa istanza di processo.</summary>
    bool Contains(int crawlJobId);

    void Pause(int crawlJobId);
    void Resume(int crawlJobId);
    bool IsPaused(int crawlJobId);
}

public class CrawlCancellationRegistry : ICrawlCancellationRegistry
{
    private readonly ConcurrentDictionary<int, CancellationTokenSource> _tokens = new();
    private readonly ConcurrentDictionary<int, bool> _paused = new();

    public CancellationToken Register(int crawlJobId)
    {
        var cts = new CancellationTokenSource();
        _tokens[crawlJobId] = cts;
        return cts.Token;
    }

    public bool TryCancel(int crawlJobId)
    {
        if (_tokens.TryGetValue(crawlJobId, out var cts))
        {
            cts.Cancel();
            return true;
        }

        return false;
    }

    public void Remove(int crawlJobId)
    {
        if (_tokens.TryRemove(crawlJobId, out var cts))
        {
            cts.Dispose();
        }

        _paused.TryRemove(crawlJobId, out _);
    }

    public bool Contains(int crawlJobId) => _tokens.ContainsKey(crawlJobId);

    public void Pause(int crawlJobId) => _paused[crawlJobId] = true;

    public void Resume(int crawlJobId) => _paused.TryRemove(crawlJobId, out _);

    public bool IsPaused(int crawlJobId) => _paused.ContainsKey(crawlJobId);
}

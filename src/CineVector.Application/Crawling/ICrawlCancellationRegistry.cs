using System.Collections.Concurrent;

namespace CineVector.Application.Crawling;

/// <summary>Coordina la cancellazione dei CrawlJob in esecuzione nel processo corrente. È una soluzione in-memory
/// adatta a una singola istanza API/Worker; il coordinamento cross-istanza (Redis) arriva in Fase 6.</summary>
public interface ICrawlCancellationRegistry
{
    CancellationToken Register(int crawlJobId);
    bool TryCancel(int crawlJobId);
    void Remove(int crawlJobId);
}

public class CrawlCancellationRegistry : ICrawlCancellationRegistry
{
    private readonly ConcurrentDictionary<int, CancellationTokenSource> _tokens = new();

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
    }
}

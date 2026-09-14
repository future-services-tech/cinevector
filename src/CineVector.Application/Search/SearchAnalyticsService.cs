using CineVector.Contracts.Observability;

namespace CineVector.Application.Search;

/// <summary>Aggregazioni anonime sull'uso della ricerca (nessun identificativo utente/sessione, per scelta di prodotto)
/// a partire da <see cref="ISearchLogRepository"/>.</summary>
public class SearchAnalyticsService(ISearchLogRepository repository)
{
    public async Task<SearchAnalyticsDto> GetAnalyticsAsync(TimeSpan window, CancellationToken ct)
    {
        var since = DateTimeOffset.UtcNow - window;
        var logs = await repository.GetSinceAsync(since, ct);

        var byMode = logs
            .GroupBy(l => l.Mode)
            .Select(g => new ModeCountDto { Mode = g.Key, Count = g.Count() })
            .OrderByDescending(m => m.Count)
            .ToList();

        var topQueries = logs
            .Where(l => !string.IsNullOrWhiteSpace(l.Query))
            .GroupBy(l => l.Query!, StringComparer.OrdinalIgnoreCase)
            .Select(g => new QueryCountDto { Query = g.Key, Count = g.Count() })
            .OrderByDescending(q => q.Count)
            .Take(20)
            .ToList();

        var volumeOverTime = logs
            .GroupBy(l => RoundToHour(l.CreatedAt))
            .Select(g => new VolumePointDto { Timestamp = g.Key, Count = g.Count() })
            .OrderBy(v => v.Timestamp)
            .ToList();

        return new SearchAnalyticsDto
        {
            TotalSearches = logs.Count,
            AverageDurationMs = logs.Count > 0 ? logs.Average(l => l.DurationMs) : 0,
            ByMode = byMode,
            TopQueries = topQueries,
            VolumeOverTime = volumeOverTime
        };
    }

    private static DateTimeOffset RoundToHour(DateTimeOffset value) =>
        new(value.Year, value.Month, value.Day, value.Hour, 0, 0, TimeSpan.Zero);
}

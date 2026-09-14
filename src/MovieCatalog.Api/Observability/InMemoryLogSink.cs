using System.Collections.Concurrent;
using Serilog.Core;
using Serilog.Events;

namespace MovieCatalog.Api.Observability;

public record LogEntrySnapshot(DateTimeOffset Timestamp, string Level, string Message, string? Exception);

public interface IInMemoryLogSink
{
    IReadOnlyCollection<LogEntrySnapshot> GetRecent(int take, string? levelFilter);
}

/// <summary>Ring buffer in-memory delle righe di log (Warning+) per il visualizzatore log dell'admin.
/// Nessuna infrastruttura esterna: coerente con la scelta di osservabilità "solo OpenTelemetry + pagina admin custom".</summary>
public class InMemoryLogSink : ILogEventSink, IInMemoryLogSink
{
    private const int MaxEntries = 500;
    private readonly ConcurrentQueue<LogEntrySnapshot> _entries = new();

    public void Emit(LogEvent logEvent)
    {
        var entry = new LogEntrySnapshot(
            logEvent.Timestamp,
            logEvent.Level.ToString(),
            logEvent.RenderMessage(),
            logEvent.Exception?.ToString());

        _entries.Enqueue(entry);

        while (_entries.Count > MaxEntries && _entries.TryDequeue(out _))
        {
        }
    }

    public IReadOnlyCollection<LogEntrySnapshot> GetRecent(int take, string? levelFilter)
    {
        IEnumerable<LogEntrySnapshot> query = _entries;

        if (!string.IsNullOrWhiteSpace(levelFilter))
        {
            query = query.Where(e => string.Equals(e.Level, levelFilter, StringComparison.OrdinalIgnoreCase));
        }

        return query.Reverse().Take(take).ToList();
    }
}

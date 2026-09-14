using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CineVector.Application.Observability;

/// <summary>Tempo di esecuzione delle query DB critiche per la ricerca ("tempi del database per ricerca").
/// Uso: <c>using var _ = DbMetrics.Measure("MovieSearchRepository.SearchAsync");</c> attorno al corpo del metodo.</summary>
public static class DbMetrics
{
    public const string MeterName = "CineVector.Database";
    public const string QueryDurationInstrumentName = "db.query.duration";

    private static readonly Meter Meter = new(MeterName);

    private static readonly Histogram<double> QueryDuration = Meter.CreateHistogram<double>(
        QueryDurationInstrumentName, unit: "ms", description: "Durata di una query DB, per operazione.");

    public static QueryTimer Measure(string operation) => new(operation);

    public readonly struct QueryTimer : IDisposable
    {
        private readonly string _operation;
        private readonly long _startTimestamp;

        internal QueryTimer(string operation)
        {
            _operation = operation;
            _startTimestamp = Stopwatch.GetTimestamp();
        }

        public void Dispose()
        {
            var elapsedMs = Stopwatch.GetElapsedTime(_startTimestamp).TotalMilliseconds;
            QueryDuration.Record(elapsedMs, new KeyValuePair<string, object?>("operation", _operation));
        }
    }
}

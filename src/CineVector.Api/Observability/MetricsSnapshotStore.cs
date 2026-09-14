using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using CineVector.Application.Observability;

namespace CineVector.Api.Observability;

public record MetricPoint(DateTimeOffset Timestamp, double Average, double Max, long Count);
public record MetricSeries(string Series, IReadOnlyList<MetricPoint> Points);

public interface IMetricsSnapshotStore
{
    IReadOnlyList<MetricSeries> GetSeries(string instrumentName, TimeSpan window);
}

/// <summary>Aggrega i Meter custom dell'applicazione (System.Diagnostics.Metrics, lo stesso standard usato da
/// OpenTelemetry) in bucket per-minuto tenuti in memoria, così la pagina admin può disegnare grafici di latenza
/// senza bisogno di Prometheus/Grafana. Un <see cref="MeterListener"/> osserva gli stessi strumenti esportati
/// anche via OpenTelemetry (vedi Program.cs): le due pipeline di lettura coesistono senza interferire.</summary>
public sealed class MetricsSnapshotStore : IMetricsSnapshotStore, IDisposable
{
    private static readonly HashSet<string> ObservedMeters = [SearchMetrics.MeterName, DbMetrics.MeterName];
    private static readonly TimeSpan BucketWidth = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan MaxRetention = TimeSpan.FromHours(6);

    private readonly ConcurrentDictionary<(string Instrument, string Series, long BucketKey), Accumulator> _buckets = new();
    private readonly MeterListener _listener;

    public MetricsSnapshotStore()
    {
        _listener = new MeterListener();
        _listener.InstrumentPublished = (instrument, listener) =>
        {
            if (ObservedMeters.Contains(instrument.Meter.Name))
            {
                listener.EnableMeasurementEvents(instrument);
            }
        };

        _listener.SetMeasurementEventCallback<double>((instrument, value, tags, _) => Record(instrument.Name, value, tags));
        _listener.SetMeasurementEventCallback<long>((instrument, value, tags, _) => Record(instrument.Name, value, tags));
        _listener.Start();
    }

    public IReadOnlyList<MetricSeries> GetSeries(string instrumentName, TimeSpan window)
    {
        var since = DateTimeOffset.UtcNow - window;
        var sinceBucket = ToBucketKey(since);

        return _buckets
            .Where(kv => kv.Key.Instrument == instrumentName && kv.Key.BucketKey >= sinceBucket)
            .GroupBy(kv => kv.Key.Series)
            .Select(g => new MetricSeries(
                g.Key,
                g.OrderBy(kv => kv.Key.BucketKey)
                    .Select(kv => new MetricPoint(FromBucketKey(kv.Key.BucketKey), kv.Value.Average, kv.Value.Max, kv.Value.Count))
                    .ToList()))
            .OrderBy(s => s.Series)
            .ToList();
    }

    private void Record(string instrumentName, double value, ReadOnlySpan<KeyValuePair<string, object?>> tags)
    {
        var series = tags.Length > 0 ? tags[0].Value?.ToString() ?? "default" : "default";
        var bucketKey = ToBucketKey(DateTimeOffset.UtcNow);
        var key = (instrumentName, series, bucketKey);

        _buckets.AddOrUpdate(key,
            _ => new Accumulator(value),
            (_, existing) =>
            {
                existing.Add(value);
                return existing;
            });

        TrimIfNeeded();
    }

    private void TrimIfNeeded()
    {
        if (_buckets.Count < 5000)
        {
            return;
        }

        var cutoff = ToBucketKey(DateTimeOffset.UtcNow - MaxRetention);
        foreach (var key in _buckets.Keys.Where(k => k.BucketKey < cutoff).ToList())
        {
            _buckets.TryRemove(key, out _);
        }
    }

    private static long ToBucketKey(DateTimeOffset timestamp) => timestamp.ToUnixTimeSeconds() / (long)BucketWidth.TotalSeconds;

    private static DateTimeOffset FromBucketKey(long bucketKey) => DateTimeOffset.FromUnixTimeSeconds(bucketKey * (long)BucketWidth.TotalSeconds);

    public void Dispose() => _listener.Dispose();

    private sealed class Accumulator
    {
        private readonly object _gate = new();
        private double _sum;
        private double _max;
        private long _count;

        public Accumulator(double initial)
        {
            _sum = initial;
            _max = initial;
            _count = 1;
        }

        public void Add(double value)
        {
            lock (_gate)
            {
                _sum += value;
                _count++;
                if (value > _max)
                {
                    _max = value;
                }
            }
        }

        public double Average
        {
            get { lock (_gate) { return _count == 0 ? 0 : _sum / _count; } }
        }

        public double Max
        {
            get { lock (_gate) { return _max; } }
        }

        public long Count
        {
            get { lock (_gate) { return _count; } }
        }
    }
}

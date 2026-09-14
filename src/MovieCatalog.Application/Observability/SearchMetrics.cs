using System.Diagnostics.Metrics;

namespace MovieCatalog.Application.Observability;

/// <summary>Strumenti OpenTelemetry (System.Diagnostics.Metrics) per la ricerca. Vive in Application perché sia
/// Search (che misura la latenza end-to-end) sia Infrastructure (che misura i tempi delle query) vi hanno accesso
/// senza creare una dipendenza incrociata tra i due.</summary>
public static class SearchMetrics
{
    public const string MeterName = "MovieCatalog.Search";
    public const string SearchDurationInstrumentName = "search.duration";
    public const string SearchRequestsInstrumentName = "search.requests";

    private static readonly Meter Meter = new(MeterName);

    public static readonly Histogram<double> SearchDuration = Meter.CreateHistogram<double>(
        SearchDurationInstrumentName, unit: "ms", description: "Durata totale di una richiesta di ricerca, per modalità (fulltext/semantic/structured/...).");

    public static readonly Counter<long> SearchRequests = Meter.CreateCounter<long>(
        SearchRequestsInstrumentName, description: "Numero di richieste di ricerca eseguite, per modalità.");
}

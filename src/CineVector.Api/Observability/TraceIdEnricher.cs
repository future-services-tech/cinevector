using System.Diagnostics;
using Serilog.Core;
using Serilog.Events;

namespace CineVector.Api.Observability;

/// <summary>Collega ogni riga di log Serilog al TraceId dell'Activity OpenTelemetry corrente (già generato
/// dalla strumentazione AspNetCore in Program.cs), così una richiesta è tracciabile end-to-end sia nei log
/// testuali sia nelle tracce esportate — senza le due pipeline restano correlate solo per timestamp.</summary>
public class TraceIdEnricher : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var traceId = Activity.Current?.TraceId.ToString() ?? "-";
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("TraceId", traceId));
    }
}

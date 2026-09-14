using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using CineVector.Api.Observability;
using CineVector.Application;
using CineVector.Application.Observability;
using CineVector.Infrastructure;
using CineVector.Search;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Sink in-memory per il visualizzatore log dell'admin (Fase 9): l'istanza è condivisa tra la pipeline
// Serilog (che vi scrive) e il DI container (da cui LogsController legge), quindi va creata prima di UseSerilog.
var inMemoryLogSink = new InMemoryLogSink();
builder.Services.AddSingleton<IInMemoryLogSink>(inMemoryLogSink);

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Sink(inMemoryLogSink, LogEventLevel.Warning));

const string corsPolicyName = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSearch(builder.Configuration);

builder.Services.AddSingleton<IMetricsSnapshotStore, MetricsSnapshotStore>();

// OpenTelemetry (Microsoft): gli stessi Meter (SearchMetrics/DbMetrics) sono osservati anche da
// MetricsSnapshotStore per alimentare la pagina admin senza bisogno di Prometheus/Grafana; l'exporter
// Console qui è la base standard, sostituibile con OTLP in futuro senza toccare il resto del codice.
builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics => metrics
        .AddMeter(SearchMetrics.MeterName)
        .AddMeter(DbMetrics.MeterName)
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddConsoleExporter())
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddConsoleExporter());

var connectionString = builder.Configuration.GetConnectionString("Postgres");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddHealthChecks()
        .AddNpgSql(connectionString, name: "postgres", tags: ["ready"]);
}

var app = builder.Build();

// I servizi Singleton in ASP.NET Core sono istanziati pigramente al primo utilizzo: senza questa risoluzione
// esplicita, il MeterListener di MetricsSnapshotStore partirebbe solo alla prima chiamata admin, perdendo
// tutte le misurazioni di ricerca/DB avvenute prima di allora.
app.Services.GetRequiredService<IMetricsSnapshotStore>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();
app.UseCors(corsPolicyName);
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

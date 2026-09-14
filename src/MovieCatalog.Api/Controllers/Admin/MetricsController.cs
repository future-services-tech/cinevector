using Microsoft.AspNetCore.Mvc;
using MovieCatalog.Api.Observability;
using MovieCatalog.Application.Observability;
using MovieCatalog.Contracts.Observability;

namespace MovieCatalog.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/metrics")]
public class MetricsController(IMetricsSnapshotStore store) : ControllerBase
{
    /// <summary>Latenza end-to-end delle richieste di ricerca, per modalità (fulltext/semantic/structured/...).</summary>
    [HttpGet("search-latency")]
    public ActionResult<IReadOnlyCollection<MetricSeriesDto>> GetSearchLatency([FromQuery] int hours = 6)
    {
        var series = store.GetSeries(SearchMetrics.SearchDurationInstrumentName, TimeSpan.FromHours(Math.Clamp(hours, 1, 24)));
        return Ok(series.Select(ToDto).ToList());
    }

    /// <summary>Tempi delle query database usate dalla ricerca, per operazione.</summary>
    [HttpGet("db-latency")]
    public ActionResult<IReadOnlyCollection<MetricSeriesDto>> GetDbLatency([FromQuery] int hours = 6)
    {
        var series = store.GetSeries(DbMetrics.QueryDurationInstrumentName, TimeSpan.FromHours(Math.Clamp(hours, 1, 24)));
        return Ok(series.Select(ToDto).ToList());
    }

    private static MetricSeriesDto ToDto(MetricSeries series) => new()
    {
        Series = series.Series,
        Points = series.Points
            .Select(p => new MetricPointDto { Timestamp = p.Timestamp, Average = p.Average, Max = p.Max, Count = p.Count })
            .ToList()
    };
}

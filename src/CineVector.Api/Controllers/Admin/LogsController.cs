using Microsoft.AspNetCore.Mvc;
using CineVector.Api.Observability;
using CineVector.Contracts.Observability;

namespace CineVector.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/logs")]
public class LogsController(IInMemoryLogSink sink) : ControllerBase
{
    /// <summary>Ultime righe di log (Warning+) tenute in memoria dal processo API. Non persistite: si azzerano al riavvio.</summary>
    [HttpGet]
    public ActionResult<IReadOnlyCollection<LogEntryDto>> GetLogs([FromQuery] string? level, [FromQuery] int take = 100)
    {
        var entries = sink.GetRecent(Math.Clamp(take, 1, 500), level);

        return Ok(entries.Select(e => new LogEntryDto
        {
            Timestamp = e.Timestamp,
            Level = e.Level,
            Message = e.Message,
            Exception = e.Exception
        }).ToList());
    }
}

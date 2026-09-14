using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Search;
using CineVector.Contracts.Observability;

namespace CineVector.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/search-analytics")]
public class SearchAnalyticsController(SearchAnalyticsService service) : ControllerBase
{
    /// <summary>Analisi aggregata e anonima dell'uso della ricerca (nessun identificativo utente/sessione).</summary>
    [HttpGet]
    public async Task<ActionResult<SearchAnalyticsDto>> Get([FromQuery] int hours = 24, CancellationToken ct = default)
    {
        var dto = await service.GetAnalyticsAsync(TimeSpan.FromHours(Math.Clamp(hours, 1, 168)), ct);
        return Ok(dto);
    }
}

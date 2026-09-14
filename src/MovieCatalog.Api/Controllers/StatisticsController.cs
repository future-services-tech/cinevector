using Microsoft.AspNetCore.Mvc;
using MovieCatalog.Application.Statistics;
using MovieCatalog.Contracts.Statistics;

namespace MovieCatalog.Api.Controllers;

[ApiController]
[Route("api/statistics")]
public class StatisticsController(IStatisticsRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<StatisticsDto>> Get(CancellationToken ct) =>
        Ok(await repository.GetStatisticsAsync(ct));
}

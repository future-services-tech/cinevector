using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Statistics;
using CineVector.Contracts.Statistics;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/statistics")]
public class StatisticsController(IStatisticsRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<StatisticsDto>> Get(CancellationToken ct) =>
        Ok(await repository.GetStatisticsAsync(ct));
}

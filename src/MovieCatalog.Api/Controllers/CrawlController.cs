using Microsoft.AspNetCore.Mvc;
using MovieCatalog.Application.Crawling;
using MovieCatalog.Application.Sources;
using MovieCatalog.Contracts.Crawling;
using MovieCatalog.Domain.Enums;

namespace MovieCatalog.Api.Controllers;

[ApiController]
[Route("api/crawl")]
public class CrawlController(
    IServiceScopeFactory scopeFactory,
    ICrawlJobRepository crawlJobRepository,
    ISourceRepository sourceRepository,
    CrawlerPipelineService pipeline,
    ICrawlCancellationRegistry cancellationRegistry,
    ILogger<CrawlController> logger) : ControllerBase
{
    [HttpGet("jobs")]
    public async Task<ActionResult<IReadOnlyCollection<CrawlJobDto>>> GetJobs(CancellationToken ct)
    {
        var jobs = await crawlJobRepository.GetRecentAsync(50, ct);
        return Ok(jobs.Select(CrawlJobMapper.ToDto).ToList());
    }

    [HttpGet("jobs/{id:int}")]
    public async Task<ActionResult<CrawlJobDto>> GetJob(int id, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(id, ct);
        return job is null ? NotFound() : Ok(CrawlJobMapper.ToDto(job));
    }

    /// <summary>Avvia il crawl per tutte le fonti abilitate.</summary>
    /// <summary>Avvia il crawl per tutte le fonti abilitate: sempre in modalità Popular (sincronizzazione generica,
    /// non ha senso applicare un unico criterio titolo/persona a più fonti insieme).</summary>
    [HttpPost("start")]
    public async Task<ActionResult<IReadOnlyCollection<CrawlJobDto>>> StartAll(CancellationToken ct)
    {
        var sources = await sourceRepository.GetEnabledAsync(ct);
        var jobs = new List<CrawlJobDto>();

        foreach (var source in sources)
        {
            jobs.Add(await StartCrawlAsync(source.Id, CrawlQuery.Popular, ct));
        }

        return Ok(jobs);
    }

    [HttpPost("{sourceId:int}/start")]
    public async Task<ActionResult<CrawlJobDto>> Start(int sourceId, [FromBody] StartCrawlRequest? request, CancellationToken ct)
    {
        var source = await sourceRepository.GetByIdAsync(sourceId, ct);
        if (source is null)
        {
            return NotFound();
        }

        var modeText = request?.Mode ?? nameof(CrawlQueryMode.Popular);
        if (!Enum.TryParse<CrawlQueryMode>(modeText, ignoreCase: true, out var mode))
        {
            return BadRequest(new { error = $"Criterio di ricerca '{modeText}' non valido." });
        }

        var queryText = request?.Query?.Trim();
        if (mode != CrawlQueryMode.Popular && string.IsNullOrEmpty(queryText))
        {
            return BadRequest(new { error = "Il criterio selezionato richiede un valore di ricerca (titolo o nome persona)." });
        }

        return Ok(await StartCrawlAsync(sourceId, new CrawlQuery(mode, queryText), ct));
    }

    [HttpPost("{sourceId:int}/cancel")]
    public async Task<IActionResult> Cancel(int sourceId, CancellationToken ct)
    {
        var runningJob = await crawlJobRepository.GetLatestRunningBySourceAsync(sourceId, ct);
        if (runningJob is null)
        {
            return NotFound(new { error = "Nessun crawl in esecuzione per questa fonte." });
        }

        var cancelled = cancellationRegistry.TryCancel(runningJob.Id);
        return cancelled
            ? Ok(new { jobId = runningJob.Id, cancelling = true })
            : NotFound(new { error = "Il job risulta 'Running' ma non è gestito da questa istanza API (riavviata dopo l'avvio del crawl?)." });
    }

    private async Task<CrawlJobDto> StartCrawlAsync(int sourceId, CrawlQuery query, CancellationToken requestCt)
    {
        var job = await pipeline.StartJobAsync(sourceId, query, requestCt);
        var backgroundToken = cancellationRegistry.Register(job.Id);

        _ = Task.Run(async () =>
        {
            using var scope = scopeFactory.CreateScope();
            var scopedPipeline = scope.ServiceProvider.GetRequiredService<CrawlerPipelineService>();

            try
            {
                await scopedPipeline.ExecuteAsync(job.Id, backgroundToken);
            }
            catch (Exception ex)
            {
                // ExecuteAsync gestisce già i propri errori marcando il job come Failed;
                // questo catch serve solo a evitare un'eccezione non osservata sul Task in background.
                logger.LogError(ex, "Eccezione non gestita durante l'esecuzione del crawl job {JobId}", job.Id);
            }
            finally
            {
                cancellationRegistry.Remove(job.Id);
            }
        }, CancellationToken.None);

        return CrawlJobMapper.ToDto(job);
    }
}

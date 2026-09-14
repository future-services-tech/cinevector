using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Crawling;
using CineVector.Application.Sources;
using CineVector.Contracts.Crawling;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;

namespace CineVector.Api.Controllers;

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
        return Ok(jobs.Select(ToDtoWithOrphanFlag).ToList());
    }

    [HttpGet("jobs/{id:int}")]
    public async Task<ActionResult<CrawlJobDto>> GetJob(int id, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(id, ct);
        return job is null ? NotFound() : Ok(ToDtoWithOrphanFlag(job));
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
            // Una fonte con un job Popular già Running/Paused non ne riceve un secondo uguale in parallelo:
            // un criterio diverso (es. un successivo Avvia crawl per Attore/Regista) resta invece libero di
            // girare in contemporanea sulla stessa fonte.
            if (await GetActiveJobConflictAsync(source.Id, CrawlQueryMode.Popular, null, ct) is not null)
            {
                continue;
            }

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

        // Impedisce di accumulare due job Running/Paused con lo stesso identico criterio (stessa "stringa di
        // chiamata": QueryMode + Query) sulla stessa fonte — click ripetuti o richieste ravvicinate con lo
        // stesso criterio non duplicano il lavoro. Un criterio diverso sulla stessa fonte resta invece
        // legittimo in parallelo (es. "Popular" e "Attore: Zendaya" insieme).
        if (await GetActiveJobConflictAsync(sourceId, mode, queryText, ct) is { } conflict)
        {
            return conflict;
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

    /// <summary>Ferma un job specifico per Id. Se il job è ancora vivo in questa istanza lo annulla in modo
    /// cooperativo (come <see cref="Cancel"/>); se invece è uno zombie (Running/Paused in DB ma orfano, es. dopo
    /// un riavvio dell'API) non c'è alcun task reale da fermare: si riconcilia direttamente lo stato in DB.</summary>
    [HttpPost("jobs/{jobId:int}/cancel")]
    public async Task<IActionResult> CancelJob(int jobId, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(jobId, ct);
        if (job is null)
        {
            return NotFound();
        }

        if (job.Status is not (CrawlJobStatus.Running or CrawlJobStatus.Paused))
        {
            return BadRequest(new { error = $"Il job è nello stato '{job.Status}', non può essere fermato." });
        }

        if (cancellationRegistry.TryCancel(jobId))
        {
            return Ok(new { jobId, cancelling = true, reconciled = false });
        }

        logger.LogWarning("Job di crawl {JobId} risultava '{Status}' ma orfano (nessuna istanza attiva): riconciliato a Cancelled.", jobId, job.Status);
        job.Status = CrawlJobStatus.Cancelled;
        job.CompletedAt = DateTimeOffset.UtcNow;
        await crawlJobRepository.SaveChangesAsync(ct);
        return Ok(new { jobId, cancelling = true, reconciled = true });
    }

    [HttpPost("jobs/{jobId:int}/pause")]
    public async Task<IActionResult> PauseJob(int jobId, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(jobId, ct);
        if (job is null)
        {
            return NotFound();
        }

        if (job.Status != CrawlJobStatus.Running)
        {
            return BadRequest(new { error = $"Il job è nello stato '{job.Status}', non può essere messo in pausa." });
        }

        if (!cancellationRegistry.Contains(jobId))
        {
            return NotFound(new { error = "Il job risulta 'Running' ma non è gestito da questa istanza API (riavviata dopo l'avvio del crawl?)." });
        }

        cancellationRegistry.Pause(jobId);
        return Ok(new { jobId, pausing = true });
    }

    [HttpPost("jobs/{jobId:int}/resume")]
    public async Task<IActionResult> ResumeJob(int jobId, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(jobId, ct);
        if (job is null)
        {
            return NotFound();
        }

        // Pulisce sempre il flag in-memory per primo, anche se lo stato in DB non è ancora "Paused": una Pause
        // può essere stata richiesta un istante prima che il loop del pipeline avesse il tempo di rilevarla e
        // scrivere lo stato. Senza questo "resume anticipato" il flag resterebbe attivo e il job si fermerebbe
        // comunque alla prossima occasione, senza che nessuna nuova Resume possa più sbloccarlo (il client crede
        // già di averlo fatto).
        var wasPaused = cancellationRegistry.IsPaused(jobId);
        cancellationRegistry.Resume(jobId);

        if (job.Status != CrawlJobStatus.Paused && !wasPaused)
        {
            return BadRequest(new { error = $"Il job è nello stato '{job.Status}', non è in pausa." });
        }

        return Ok(new { jobId, resuming = true });
    }

    /// <summary>Elimina il job: se è ancora vivo prova prima a fermarlo (best-effort), poi rimuove il record
    /// e i relativi errori dal DB (cascade). L'unica traccia dell'operazione resta nei log applicativi.</summary>
    [HttpDelete("jobs/{jobId:int}")]
    public async Task<IActionResult> DeleteJob(int jobId, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(jobId, ct);
        if (job is null)
        {
            return NotFound();
        }

        if (job.Status is CrawlJobStatus.Running or CrawlJobStatus.Paused)
        {
            cancellationRegistry.TryCancel(jobId);
        }

        logger.LogInformation(
            "Job di crawl {JobId} eliminato (fonte {SourceId}, stato al momento dell'eliminazione: {Status}, pagine visitate: {Pages}).",
            job.Id, job.SourceId, job.Status, job.PagesVisited);

        await crawlJobRepository.DeleteAsync(jobId, ct);
        return NoContent();
    }

    /// <summary>Null se non esiste già un job Running/Paused per la stessa fonte con lo stesso identico
    /// criterio (QueryMode + Query — la "stringa di chiamata"); altrimenti la risposta 409 da restituire, con
    /// un messaggio diverso a seconda che il job trovato sia ancora vivo in questa istanza o sia uno zombie
    /// (nel qual caso indica di fermarlo/eliminarlo prima, invece di lasciarne accumulare altri). Un criterio
    /// diverso sulla stessa fonte non genera conflitto: il parallelismo tra criteri diversi è intenzionale.</summary>
    private async Task<ActionResult?> GetActiveJobConflictAsync(int sourceId, CrawlQueryMode mode, string? query, CancellationToken ct)
    {
        var existing = await crawlJobRepository.GetLatestActiveByCriteriaAsync(sourceId, mode, query, ct);
        if (existing is null)
        {
            return null;
        }

        var isOrphaned = !cancellationRegistry.Contains(existing.Id);
        return Conflict(new
        {
            error = isOrphaned
                ? $"Il job {existing.Id} con lo stesso criterio risulta '{existing.Status}' ma è orfano (nessuna istanza attiva lo gestisce): fermalo o eliminalo prima di avviarne uno nuovo con lo stesso criterio."
                : $"È già in corso un crawl con lo stesso criterio per questa fonte (job {existing.Id}, stato '{existing.Status}').",
            jobId = existing.Id,
            isOrphaned
        });
    }

    private CrawlJobDto ToDtoWithOrphanFlag(CrawlJob job)
    {
        var dto = CrawlJobMapper.ToDto(job);
        dto.IsOrphaned = job.Status is CrawlJobStatus.Running or CrawlJobStatus.Paused
            && !cancellationRegistry.Contains(job.Id);
        return dto;
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

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CineVector.Application.Embeddings;
using CineVector.Application.Movies;
using CineVector.Application.Sources;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;

namespace CineVector.Application.Crawling;

/// <summary>Orchestratore indipendente dalla fonte: discovery -> canonicalizzazione URL -> estrazione -> enrichment -> upsert,
/// con tracciamento in <see cref="CrawlJob"/>. Non conosce dettagli di alcuna fonte specifica: quelli vivono
/// esclusivamente negli <see cref="ISourceAdapter"/> registrati in Infrastructure/Sources.
///
/// <see cref="StartJobAsync"/> e <see cref="ExecuteAsync"/> sono separati apposta: il chiamante (API) crea il job
/// nella propria scope di richiesta per restituire subito l'Id al client, poi esegue <see cref="ExecuteAsync"/> in una
/// scope DI dedicata avviata in background, così il DbContext non viene condiviso tra richiesta HTTP e lavoro asincrono.</summary>
public class CrawlerPipelineService(
    ISourceAdapterFactory adapterFactory,
    ISourceRepository sourceRepository,
    ICrawlJobRepository crawlJobRepository,
    MovieService movieService,
    EmbeddingIndexingService embeddingIndexingService,
    IMetadataEnrichmentService enrichmentService,
    IUrlCanonicalizer urlCanonicalizer,
    IOptions<CrawlerOptions> options,
    ILogger<CrawlerPipelineService> logger)
{
    public Task<CrawlJob> StartJobAsync(int sourceId, CrawlQuery query, CancellationToken ct) =>
        crawlJobRepository.CreateAsync(sourceId, query, ct);

    public async Task ExecuteAsync(int jobId, CancellationToken ct)
    {
        var job = await crawlJobRepository.GetByIdAsync(jobId, ct)
            ?? throw new InvalidOperationException($"CrawlJob {jobId} non trovato.");

        var source = await sourceRepository.GetByIdAsync(job.SourceId, ct)
            ?? throw new InvalidOperationException($"Source {job.SourceId} non trovata.");

        var adapter = adapterFactory.GetAdapter(source.AdapterType)
            ?? throw new InvalidOperationException($"Nessun adapter registrato per AdapterType '{source.AdapterType}'.");

        logger.LogInformation("Crawl avviato per {Source} (job {JobId})", source.Name, job.Id);

        try
        {
            var query = new CrawlQuery(job.QueryMode, job.Query);
            var urls = await adapter.DiscoverMovieUrlsAsync(query, ct);
            logger.LogInformation("Discovery completata per {Source}: {Count} pagine trovate (job {JobId})", source.Name, urls.Count, job.Id);

            foreach (var rawUrl in urls)
            {
                ct.ThrowIfCancellationRequested();
                await ProcessOneAsync(job, source.Name, adapter, rawUrl, ct);

                if (options.Value.DelayMilliseconds > 0)
                {
                    await Task.Delay(options.Value.DelayMilliseconds, ct);
                }
            }

            job.Status = CrawlJobStatus.Completed;

            var embeddingBatchSize = Math.Max(job.MoviesCreated + job.MoviesUpdated, 1);
            var embedded = await embeddingIndexingService.ProcessPendingAsync(embeddingBatchSize, CancellationToken.None);
            logger.LogInformation("Embedding generati per {Count} film dopo il crawl (job {JobId})", embedded, job.Id);
        }
        catch (OperationCanceledException)
        {
            job.Status = CrawlJobStatus.Cancelled;
            logger.LogInformation("Crawl annullato per {Source} (job {JobId})", source.Name, job.Id);
        }
        catch (Exception ex)
        {
            // Difensivo: se l'eccezione arriva da una SaveChangesAsync fallita (es. durante il backfill embedding
            // dopo il loop) il DbContext potrebbe avere entità tracciate che rifarebbero fallire i salvataggi
            // successivi, incluso quello in finally che marca il job — si ripristina il tracking anche qui.
            crawlJobRepository.ResetTrackingKeepingJob(job);
            job.Status = CrawlJobStatus.Failed;
            await crawlJobRepository.AddErrorAsync(job.Id, source.BaseUrl, ex.GetType().Name, ex.Message, CancellationToken.None);
            logger.LogError(ex, "Crawl fallito per {Source} (job {JobId})", source.Name, job.Id);
        }
        finally
        {
            job.CompletedAt = DateTimeOffset.UtcNow;
            await sourceRepository.UpdateLastCrawlAsync(source.Id, DateTimeOffset.UtcNow, CancellationToken.None);
            await crawlJobRepository.SaveChangesAsync(CancellationToken.None);

            logger.LogInformation(
                "Crawl {Status} per {Source} (job {JobId}): {Visited} visitate, {Found} trovate, {Created} create, {Updated} aggiornate",
                job.Status, source.Name, job.Id, job.PagesVisited, job.MoviesFound, job.MoviesCreated, job.MoviesUpdated);
        }
    }

    private async Task ProcessOneAsync(CrawlJob job, string sourceName, ISourceAdapter adapter, string rawUrl, CancellationToken ct)
    {
        var canonicalUrl = urlCanonicalizer.Canonicalize(rawUrl);
        if (canonicalUrl is null)
        {
            await crawlJobRepository.AddErrorAsync(job.Id, rawUrl, "InvalidUrl",
                "URL non canonicalizzabile: schema non http/https oppure risorsa multimediale (video/stream) esclusa per policy.", ct);
            return;
        }

        try
        {
            var metadata = await adapter.ExtractMovieMetadataAsync(canonicalUrl, ct);
            job.PagesVisited++;

            if (metadata is null)
            {
                await crawlJobRepository.SaveChangesAsync(ct);
                return;
            }

            job.MoviesFound++;
            metadata = await enrichmentService.EnrichAsync(metadata, ct);

            var result = await movieService.UpsertFromCrawlAsync(sourceName, metadata, ct);
            if (result.WasCreated)
            {
                job.MoviesCreated++;
            }
            else if (result.WasChanged)
            {
                job.MoviesUpdated++;
            }

            await crawlJobRepository.SaveChangesAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Errore durante l'estrazione di {Url} (job {JobId})", canonicalUrl, job.Id);

            // Se l'eccezione viene da una SaveChangesAsync fallita (es. vincolo di unicità), l'entità incriminata
            // resta tracciata e rifarebbe fallire ogni salvataggio successivo in questo stesso DbContext,
            // incluso quello che marca il job come completato/fallito in ExecuteAsync: si ripristina il tracking.
            crawlJobRepository.ResetTrackingKeepingJob(job);
            await crawlJobRepository.AddErrorAsync(job.Id, canonicalUrl, ex.GetType().Name, ex.Message, ct);
        }
    }
}

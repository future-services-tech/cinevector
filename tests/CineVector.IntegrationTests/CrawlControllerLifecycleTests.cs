using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using CineVector.Api.Controllers;
using CineVector.Application.Crawling;
using CineVector.Contracts.Crawling;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;
using CineVector.Infrastructure.Crawling;
using CineVector.Infrastructure.Persistence;
using CineVector.Infrastructure.Sources;
using Xunit;

namespace CineVector.IntegrationTests;

/// <summary>Copre il ciclo di vita dei crawl job (pausa/riprendi/ferma/elimina, rilevamento job orfani) a
/// livello di CrawlController, usando <see cref="InMemoryCrawlCancellationRegistry"/> come test double al posto
/// di Redis: il comportamento del controller dipende solo dall'astrazione <see cref="ICrawlCancellationRegistry"/>,
/// non dall'implementazione concreta. Start/StartAll (che avviano l'esecuzione reale del pipeline in
/// background tramite IServiceScopeFactory) non sono coperti qui: richiederebbero l'intero grafo DI del
/// pipeline (adapter, embedding, enrichment) e introdurrebbero non-determinismo legato allo scheduling del
/// Task.Run in background.</summary>
[Collection("Crawl")]
public class CrawlControllerLifecycleTests(CrawlTestFixture fixture)
{
    private sealed record Ctx(CrawlController Controller, CrawlJobRepository Repository, InMemoryCrawlCancellationRegistry Registry, AppDbContext Db);

    private Ctx CreateContext()
    {
        var db = fixture.CreateDbContext();
        var repository = new CrawlJobRepository(db);
        var sourceRepository = new SourceRepository(db);
        var registry = new InMemoryCrawlCancellationRegistry();
        var controller = new CrawlController(
            scopeFactory: null!,
            crawlJobRepository: repository,
            sourceRepository: sourceRepository,
            pipeline: null!,
            cancellationRegistry: registry,
            logger: NullLogger<CrawlController>.Instance);

        return new Ctx(controller, repository, registry, db);
    }

    private static async Task<Source> SeedSourceAsync(AppDbContext db, string name)
    {
        var source = new Source { Name = name, BaseUrl = "https://example.com", AdapterType = "Tmdb", Enabled = true };
        db.Sources.Add(source);
        await db.SaveChangesAsync();
        return source;
    }

    private static async Task<CrawlJob> SeedRunningJobAsync(Ctx ctx, Source source, bool registerAsAlive)
    {
        var job = await ctx.Repository.CreateAsync(source.Id, CrawlQuery.Popular, default);
        if (registerAsAlive)
        {
            await ctx.Registry.RegisterAsync(job.Id, default);
        }

        return job;
    }

    /// <summary>Legge una proprietà di un oggetto anonimo (es. `new { jobId = 1, reconciled = false }`) creato
    /// nel controller: più robusto di un confronto su ToString().</summary>
    private static T GetAnonymousProperty<T>(object value, string propertyName)
    {
        var property = value.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance)
            ?? throw new InvalidOperationException($"Proprietà '{propertyName}' non trovata su {value.GetType()}.");
        return (T)property.GetValue(value)!;
    }

    [Fact]
    public async Task CancelJob_AliveRunningJob_CancelsWithoutReconciling()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Alive-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);

        var result = await ctx.Controller.CancelJob(job.Id, default);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True(GetAnonymousProperty<bool>(ok.Value!, "cancelling"));
        Assert.False(GetAnonymousProperty<bool>(ok.Value!, "reconciled"));
    }

    [Fact]
    public async Task CancelJob_OrphanRunningJob_ReconciledToCancelledInDb()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Orphan-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: false); // mai registrato: nessuna istanza lo gestisce

        var result = await ctx.Controller.CancelJob(job.Id, default);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True(GetAnonymousProperty<bool>(ok.Value!, "reconciled"));

        var reloaded = await ctx.Repository.GetByIdAsync(job.Id, default);
        Assert.Equal(CrawlJobStatus.Cancelled, reloaded!.Status);
        Assert.NotNull(reloaded.CompletedAt);
    }

    [Fact]
    public async Task CancelJob_AlreadyCompleted_ReturnsBadRequest()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Completed-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);
        job.Status = CrawlJobStatus.Completed;
        await ctx.Repository.SaveChangesAsync(default);

        var result = await ctx.Controller.CancelJob(job.Id, default);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task CancelJob_UnknownId_ReturnsNotFound()
    {
        var ctx = CreateContext();

        var result = await ctx.Controller.CancelJob(int.MaxValue, default);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task PauseJob_AliveRunningJob_SetsPauseFlag()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Pause-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);

        var result = await ctx.Controller.PauseJob(job.Id, default);

        Assert.IsType<OkObjectResult>(result);
        Assert.True(await ctx.Registry.IsPausedAsync(job.Id, default));
    }

    [Fact]
    public async Task PauseJob_OrphanRunningJob_ReturnsNotFound()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "PauseOrphan-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: false);

        var result = await ctx.Controller.PauseJob(job.Id, default);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task ResumeJob_PausedInDb_ClearsFlag()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Resume-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);
        job.Status = CrawlJobStatus.Paused;
        await ctx.Repository.SaveChangesAsync(default);
        await ctx.Registry.PauseAsync(job.Id, default);

        var result = await ctx.Controller.ResumeJob(job.Id, default);

        Assert.IsType<OkObjectResult>(result);
        Assert.False(await ctx.Registry.IsPausedAsync(job.Id, default));
    }

    [Fact]
    public async Task ResumeJob_RaceBeforeDbReflectsPause_StillSucceedsAndClearsFlag()
    {
        // Il flag in registry è stato impostato (Pause appena chiamata) ma il loop del pipeline non ha ancora
        // scritto Status=Paused in DB: la resume deve comunque avere effetto, non fallire con BadRequest.
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "ResumeRace-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);
        await ctx.Registry.PauseAsync(job.Id, default);

        var result = await ctx.Controller.ResumeJob(job.Id, default);

        Assert.IsType<OkObjectResult>(result);
        Assert.False(await ctx.Registry.IsPausedAsync(job.Id, default));
    }

    [Fact]
    public async Task ResumeJob_NotPaused_ReturnsBadRequest()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "ResumeNotPaused-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);

        var result = await ctx.Controller.ResumeJob(job.Id, default);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task DeleteJob_RemovesRecordFromDb()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "Delete-" + Guid.NewGuid());
        var job = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);

        var result = await ctx.Controller.DeleteJob(job.Id, default);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await ctx.Repository.GetByIdAsync(job.Id, default));
    }

    [Fact]
    public async Task GetJobs_OrphanFlag_ReflectsRegistryState()
    {
        var ctx = CreateContext();
        var source = await SeedSourceAsync(ctx.Db, "OrphanFlag-" + Guid.NewGuid());
        var aliveJob = await SeedRunningJobAsync(ctx, source, registerAsAlive: true);
        var orphanJob = await SeedRunningJobAsync(ctx, source, registerAsAlive: false);

        var actionResult = await ctx.Controller.GetJobs(default);

        var ok = Assert.IsType<OkObjectResult>(actionResult.Result);
        var dtos = Assert.IsAssignableFrom<IReadOnlyCollection<CrawlJobDto>>(ok.Value);
        Assert.False(dtos.Single(d => d.Id == aliveJob.Id).IsOrphaned);
        Assert.True(dtos.Single(d => d.Id == orphanJob.Id).IsOrphaned);
    }
}

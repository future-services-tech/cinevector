using CineVector.Application.Crawling;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;
using CineVector.Infrastructure.Crawling;
using CineVector.Infrastructure.Persistence;
using Xunit;

namespace CineVector.IntegrationTests;

[Collection("Crawl")]
public class CrawlJobRepositoryTests(CrawlTestFixture fixture)
{
    private (CrawlJobRepository Repository, AppDbContext Db) CreateRepository()
    {
        var db = fixture.CreateDbContext();
        return (new CrawlJobRepository(db), db);
    }

    private static async Task<Source> SeedSourceAsync(AppDbContext db, string name)
    {
        var source = new Source { Name = name, BaseUrl = "https://example.com", AdapterType = "Tmdb", Enabled = true };
        db.Sources.Add(source);
        await db.SaveChangesAsync();
        return source;
    }

    [Fact]
    public async Task GetLatestActiveByCriteriaAsync_SameCriteriaRunning_ReturnsJob()
    {
        var (repository, db) = CreateRepository();
        var source = await SeedSourceAsync(db, "SourceA-" + Guid.NewGuid());
        var created = await repository.CreateAsync(source.Id, CrawlQuery.Popular, default);

        var found = await repository.GetLatestActiveByCriteriaAsync(source.Id, CrawlQueryMode.Popular, null, default);

        Assert.NotNull(found);
        Assert.Equal(created.Id, found!.Id);
    }

    [Fact]
    public async Task GetLatestActiveByCriteriaAsync_DifferentCriteria_ReturnsNull_AllowingParallelCrawls()
    {
        var (repository, db) = CreateRepository();
        var source = await SeedSourceAsync(db, "SourceB-" + Guid.NewGuid());
        await repository.CreateAsync(source.Id, CrawlQuery.Popular, default);

        var found = await repository.GetLatestActiveByCriteriaAsync(
            source.Id, CrawlQueryMode.Actor, "Tom Hanks", default);

        Assert.Null(found);
    }

    [Fact]
    public async Task GetLatestActiveByCriteriaAsync_JobCompleted_ReturnsNull()
    {
        var (repository, db) = CreateRepository();
        var source = await SeedSourceAsync(db, "SourceC-" + Guid.NewGuid());
        var job = await repository.CreateAsync(source.Id, CrawlQuery.Popular, default);
        job.Status = CrawlJobStatus.Completed;
        await repository.SaveChangesAsync(default);

        var found = await repository.GetLatestActiveByCriteriaAsync(source.Id, CrawlQueryMode.Popular, null, default);

        Assert.Null(found);
    }

    [Fact]
    public async Task GetLatestActiveByCriteriaAsync_JobPaused_StillCountsAsActive()
    {
        var (repository, db) = CreateRepository();
        var source = await SeedSourceAsync(db, "SourceD-" + Guid.NewGuid());
        var job = await repository.CreateAsync(source.Id, CrawlQuery.Popular, default);
        job.Status = CrawlJobStatus.Paused;
        await repository.SaveChangesAsync(default);

        var found = await repository.GetLatestActiveByCriteriaAsync(source.Id, CrawlQueryMode.Popular, null, default);

        Assert.NotNull(found);
        Assert.Equal(job.Id, found!.Id);
    }

    [Fact]
    public async Task DeleteAsync_RemovesJobAndCascadesErrors()
    {
        var (repository, db) = CreateRepository();
        var source = await SeedSourceAsync(db, "SourceE-" + Guid.NewGuid());
        var job = await repository.CreateAsync(source.Id, CrawlQuery.Popular, default);
        await repository.AddErrorAsync(job.Id, "https://example.com/x", "TestError", "boom", default);

        var deleted = await repository.DeleteAsync(job.Id, default);

        Assert.True(deleted);
        Assert.Null(await repository.GetByIdAsync(job.Id, default));
        Assert.False(db.CrawlErrors.Any(e => e.CrawlJobId == job.Id));
    }

    [Fact]
    public async Task DeleteAsync_UnknownId_ReturnsFalse()
    {
        var (repository, _) = CreateRepository();

        var deleted = await repository.DeleteAsync(int.MaxValue, default);

        Assert.False(deleted);
    }
}

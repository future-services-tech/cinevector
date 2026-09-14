using Microsoft.Extensions.Logging.Abstractions;
using CineVector.Application.Crawling;
using CineVector.Application.Movies;
using CineVector.Application.People;
using CineVector.Infrastructure.Movies;
using Xunit;

namespace CineVector.IntegrationTests;

/// <summary>Stub di test: nessuna chiamata di rete reale a Wikipedia durante i test di integrazione.</summary>
internal class NullWikipediaLookupService : IWikipediaLookupService
{
    public Task<string?> FindArticleUrlAsync(string personName, CancellationToken ct) => Task.FromResult<string?>(null);
}

[Collection("Crawl")]
public class MovieServiceCrawlUpsertTests(CrawlTestFixture fixture)
{
    private static MovieMetadata SampleMetadata(string externalId = "1", double rating = 7.5, string? overview = "Overview A") => new()
    {
        ExternalId = externalId,
        Title = "Test Movie",
        Year = 2020,
        Overview = overview,
        Rating = rating,
        PlatformUrl = "https://example.com/movie/" + externalId,
        Genres = ["Drama"],
        Directors = [new MoviePersonRef("Some Director")]
    };

    private MovieService CreateService(out CineVector.Infrastructure.Persistence.AppDbContext db)
    {
        db = fixture.CreateDbContext();
        var repository = new MovieRepository(db);
        return new MovieService(repository, NullLogger<MovieService>.Instance, new NullWikipediaLookupService());
    }

    [Fact]
    public async Task UpsertFromCrawlAsync_NewMovie_IsCreated()
    {
        var service = CreateService(out _);

        var result = await service.UpsertFromCrawlAsync("SourceA", SampleMetadata(externalId: "created-1"), default);

        Assert.True(result.WasCreated);
        Assert.False(result.WasChanged);
        Assert.Equal("Test Movie", result.Movie.Title);
    }

    [Fact]
    public async Task UpsertFromCrawlAsync_SameMetadataTwice_SecondCallIsNoOp()
    {
        var service = CreateService(out _);
        var metadata = SampleMetadata(externalId: "unchanged-1");

        var first = await service.UpsertFromCrawlAsync("SourceB", metadata, default);
        var second = await service.UpsertFromCrawlAsync("SourceB", metadata, default);

        Assert.True(first.WasCreated);
        Assert.False(second.WasCreated);
        Assert.False(second.WasChanged);
        Assert.Equal(first.Movie.Id, second.Movie.Id);
    }

    [Fact]
    public async Task UpsertFromCrawlAsync_ChangedMetadata_IsMarkedAsChanged()
    {
        var service = CreateService(out _);
        var externalId = "changed-1";

        var first = await service.UpsertFromCrawlAsync("SourceC", SampleMetadata(externalId, rating: 7.5), default);
        var second = await service.UpsertFromCrawlAsync("SourceC", SampleMetadata(externalId, rating: 8.9), default);

        Assert.False(second.WasCreated);
        Assert.True(second.WasChanged);
        Assert.Equal(first.Movie.Id, second.Movie.Id);
        Assert.Equal(8.9, second.Movie.Rating);
    }

    [Fact]
    public async Task UpsertFromCrawlAsync_SameTitleYearDifferentSource_CreatesSeparateMovieWithoutBlocking()
    {
        var service = CreateService(out _);

        var fromSourceD = await service.UpsertFromCrawlAsync("SourceD", SampleMetadata(externalId: "dup-d"), default);
        var fromSourceE = await service.UpsertFromCrawlAsync("SourceE", SampleMetadata(externalId: "dup-e"), default);

        Assert.True(fromSourceD.WasCreated);
        Assert.True(fromSourceE.WasCreated);
        Assert.NotEqual(fromSourceD.Movie.Id, fromSourceE.Movie.Id);
    }
}

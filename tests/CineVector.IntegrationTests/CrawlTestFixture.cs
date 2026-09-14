using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using CineVector.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace CineVector.IntegrationTests;

public class CrawlTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("pgvector/pgvector:pg16").Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    public AppDbContext CreateDbContext()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Embedding:Dimensions"] = "384" })
            .Build();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_container.GetConnectionString(), npgsql => npgsql.UseVector())
            .Options;

        return new AppDbContext(options, configuration);
    }
}

[CollectionDefinition("Crawl")]
public class CrawlCollection : ICollectionFixture<CrawlTestFixture>;

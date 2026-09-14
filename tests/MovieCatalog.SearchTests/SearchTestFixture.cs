using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MovieCatalog.Application.Movies;
using MovieCatalog.Application.People;
using MovieCatalog.Contracts.Movies;
using MovieCatalog.Infrastructure.Movies;
using MovieCatalog.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace MovieCatalog.SearchTests;

/// <summary>Stub di test: nessuna chiamata di rete reale a Wikipedia durante i test di ricerca.</summary>
internal class NullWikipediaLookupService : IWikipediaLookupService
{
    public Task<string?> FindArticleUrlAsync(string personName, CancellationToken ct) => Task.FromResult<string?>(null);
}

/// <summary>Avvia un Postgres reale (pgvector/pgvector:pg16) via Testcontainers, applica le migration e semina un piccolo catalogo deterministico, così i test di ricerca esercitano anche i trigger SQL che mantengono search_vector.</summary>
public class SearchTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("pgvector/pgvector:pg16").Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
        await SeedAsync(db);
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

    private static async Task SeedAsync(AppDbContext db)
    {
        var repository = new MovieRepository(db);
        var service = new MovieService(repository, NullLogger<MovieService>.Instance, new NullWikipediaLookupService());

        await service.CreateAsync(new UpsertMovieRequest
        {
            SourceName = "TMDb",
            ExternalId = "157336",
            Title = "Interstellar",
            OriginalTitle = "Interstellar",
            Year = 2014,
            Overview = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            Rating = 8.4,
            PlatformUrl = "https://www.themoviedb.org/movie/157336",
            Language = "en",
            Genres = ["Science Fiction", "Drama", "Adventure"],
            Directors = ["Christopher Nolan"],
            Cast =
            [
                new UpsertMovieCastMember { Name = "Matthew McConaughey", Character = "Cooper", BillingOrder = 0 },
                new UpsertMovieCastMember { Name = "Anne Hathaway", Character = "Brand", BillingOrder = 1 }
            ]
        }, default);

        await service.CreateAsync(new UpsertMovieRequest
        {
            SourceName = "TMDb",
            ExternalId = "27205",
            Title = "Inception",
            OriginalTitle = "Inception",
            Year = 2010,
            Overview = "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
            Rating = 8.8,
            PlatformUrl = "https://www.themoviedb.org/movie/27205",
            Language = "en",
            Genres = ["Science Fiction", "Action", "Thriller"],
            Directors = ["Christopher Nolan"],
            Cast = [new UpsertMovieCastMember { Name = "Leonardo DiCaprio", Character = "Cobb", BillingOrder = 0 }]
        }, default);

        await service.CreateAsync(new UpsertMovieRequest
        {
            SourceName = "TMDb",
            ExternalId = "424",
            Title = "Schindler's List",
            OriginalTitle = "Schindler's List",
            Year = 1993,
            Overview = "In German-occupied Poland, industrialist Oskar Schindler becomes concerned for his Jewish workforce.",
            Rating = 8.6,
            PlatformUrl = "https://www.themoviedb.org/movie/424",
            Language = "en",
            Genres = ["Drama", "History", "War"],
            Directors = ["Steven Spielberg"]
        }, default);

        await service.CreateAsync(new UpsertMovieRequest
        {
            SourceName = "TMDb",
            ExternalId = "medcomedy1",
            Title = "Second Chances",
            Year = 2019,
            Overview = "A romantic comedy about a woman who gets a second chance at love after moving to a small Italian town.",
            Rating = 6.9,
            PlatformUrl = "https://www.themoviedb.org/movie/medcomedy1",
            Language = "it",
            Genres = ["Romance", "Comedy"],
            Directors = ["Jane Doe"]
        }, default);
    }
}

[CollectionDefinition("Search")]
public class SearchCollection : ICollectionFixture<SearchTestFixture>;

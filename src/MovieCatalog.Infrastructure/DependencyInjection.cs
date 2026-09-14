using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MovieCatalog.Application.Clustering;
using MovieCatalog.Application.Crawling;
using MovieCatalog.Application.Embeddings;
using MovieCatalog.Application.Movies;
using MovieCatalog.Application.People;
using MovieCatalog.Application.Search;
using MovieCatalog.Application.Sources;
using MovieCatalog.Application.Statistics;
using MovieCatalog.Infrastructure.Clustering;
using MovieCatalog.Infrastructure.Crawling;
using MovieCatalog.Infrastructure.Embeddings;
using MovieCatalog.Infrastructure.Movies;
using MovieCatalog.Infrastructure.People;
using MovieCatalog.Infrastructure.Persistence;
using MovieCatalog.Infrastructure.Search;
using MovieCatalog.Infrastructure.Sources;
using MovieCatalog.Infrastructure.Sources.Tmdb;
using MovieCatalog.Infrastructure.Statistics;

namespace MovieCatalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Connection string 'Postgres' non configurata.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql => npgsql.UseVector()));

        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<IMovieSearchRepository, MovieSearchRepository>();
        services.AddScoped<ISearchLogRepository, SearchLogRepository>();
        services.AddScoped<ISourceRepository, SourceRepository>();
        services.AddScoped<ICrawlJobRepository, CrawlJobRepository>();
        services.AddScoped<IUrlCanonicalizer, UrlCanonicalizer>();
        services.AddScoped<ISourceAdapterFactory, SourceAdapterFactory>();
        services.AddScoped<IClusterRepository, ClusterRepository>();
        services.AddScoped<IStatisticsRepository, StatisticsRepository>();

        AddTmdbSource(services, configuration);
        AddEmbeddingProvider(services, configuration);
        AddWikipediaLookup(services);

        return services;
    }

    private static void AddWikipediaLookup(IServiceCollection services)
    {
        services.AddHttpClient<IWikipediaLookupService, WikipediaLookupService>(http =>
            {
                http.BaseAddress = new Uri("https://en.wikipedia.org/");
                // L'API di Wikipedia richiede uno User-Agent descrittivo e rifiuta richieste anonime/generiche.
                http.DefaultRequestHeaders.UserAgent.ParseAdd("MovieCatalogV3/1.0 (progetto didattico; contatto: n/a)");
            })
            .AddStandardResilienceHandler();
    }

    private static void AddEmbeddingProvider(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EmbeddingOptions>(configuration.GetSection(EmbeddingOptions.SectionName));

        services.AddHttpClient<IEmbeddingService, OmniRouterEmbeddingService>((sp, http) =>
            {
                var options = configuration.GetSection(EmbeddingOptions.SectionName).Get<EmbeddingOptions>()
                    ?? throw new InvalidOperationException("Sezione di configurazione 'Embedding' mancante.");

                var apiKey = Environment.GetEnvironmentVariable(options.ApiKeyEnvironmentVariable);
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    throw new InvalidOperationException(
                        $"Variabile d'ambiente '{options.ApiKeyEnvironmentVariable}' non impostata: necessaria per il provider di embedding.");
                }

                http.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            })
            .AddStandardResilienceHandler();
    }

    private static void AddTmdbSource(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TmdbOptions>(configuration.GetSection(TmdbOptions.SectionName));

        services.AddHttpClient<TmdbApiClient>((sp, http) =>
            {
                var options = configuration.GetSection(TmdbOptions.SectionName).Get<TmdbOptions>()
                    ?? throw new InvalidOperationException("Sezione di configurazione 'Tmdb' mancante.");

                var apiKey = Environment.GetEnvironmentVariable(options.ApiKeyEnvironmentVariable);
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    throw new InvalidOperationException(
                        $"Variabile d'ambiente '{options.ApiKeyEnvironmentVariable}' non impostata: necessaria per l'adapter TMDb.");
                }

                // BaseAddress punta sempre e solo alla configurazione applicativa (mai a Source.BaseUrl, che è
                // un campo modificabile da un amministratore): evita che una modifica alla Source diventi un SSRF.
                http.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            })
            .AddStandardResilienceHandler();

        services.AddKeyedScoped<ISourceAdapter, TmdbSourceAdapter>("Tmdb");
    }
}

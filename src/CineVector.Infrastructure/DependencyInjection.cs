using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using CineVector.Application.Clustering;
using CineVector.Application.Crawling;
using CineVector.Application.Embeddings;
using CineVector.Application.Movies;
using CineVector.Application.People;
using CineVector.Application.Search;
using CineVector.Application.Settings;
using CineVector.Application.Sources;
using CineVector.Application.Statistics;
using CineVector.Infrastructure.Clustering;
using CineVector.Infrastructure.Crawling;
using CineVector.Infrastructure.Embeddings;
using CineVector.Infrastructure.Movies;
using CineVector.Infrastructure.Music.Spotify;
using CineVector.Infrastructure.People;
using CineVector.Infrastructure.Persistence;
using CineVector.Infrastructure.Search;
using CineVector.Infrastructure.Settings;
using CineVector.Infrastructure.Sources;
using CineVector.Infrastructure.Sources.Tmdb;
using CineVector.Infrastructure.Statistics;

namespace CineVector.Infrastructure;

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
        services.AddScoped<IAppSettingsRepository, SettingsRepository>();

        AddCrawlCoordination(services, configuration);
        AddTmdbSource(services, configuration);
        AddEmbeddingProvider(services, configuration);
        AddWikipediaLookup(services);
        AddSpotify(services, configuration);

        return services;
    }

    /// <summary>Ricerca nel catalogo pubblico Spotify (mai libreria/playlist utente): Client Credentials Flow,
    /// l'app si autentica come sé stessa con Client ID + Secret app-level, stesso pattern di TMDB_API_KEY —
    /// nessun login/OAuth utente, nessun token esposto al frontend (il backend fa da proxy).</summary>
    private static void AddSpotify(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SpotifyOptions>(configuration.GetSection(SpotifyOptions.SectionName));

        services.AddHttpClient("SpotifyAuth", (sp, http) =>
            {
                var options = configuration.GetSection(SpotifyOptions.SectionName).Get<SpotifyOptions>() ?? new SpotifyOptions();
                http.BaseAddress = new Uri(options.AuthBaseUrl);
            })
            .AddStandardResilienceHandler();

        services.AddSingleton<SpotifyAccountStore>();
        services.AddSingleton<SpotifyTokenProvider>();

        services.AddHttpClient<SpotifyApiClient>((sp, http) =>
            {
                var options = configuration.GetSection(SpotifyOptions.SectionName).Get<SpotifyOptions>() ?? new SpotifyOptions();
                http.BaseAddress = new Uri(options.ApiBaseUrl);
            })
            .AddStandardResilienceHandler();
    }

    /// <summary>Registro condiviso via Redis per cancellazione/pausa/rilevamento-orfani dei crawl job: una
    /// singola connessione multiplexata, riusata da tutte le richieste (StackExchange.Redis è pensato per
    /// essere un singleton a lunga vita, non per essere creato per richiesta).</summary>
    private static void AddCrawlCoordination(IServiceCollection services, IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("Connection string 'Redis' non configurata.");

        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnectionString));
        services.AddSingleton<ICrawlCancellationRegistry, RedisCrawlCancellationRegistry>();
    }

    private static void AddWikipediaLookup(IServiceCollection services)
    {
        services.AddHttpClient<IWikipediaLookupService, WikipediaLookupService>(http =>
            {
                http.BaseAddress = new Uri("https://en.wikipedia.org/");
                // L'API di Wikipedia richiede uno User-Agent descrittivo e rifiuta richieste anonime/generiche.
                http.DefaultRequestHeaders.UserAgent.ParseAdd("CineVectorV3/1.0 (progetto didattico; contatto: n/a)");
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

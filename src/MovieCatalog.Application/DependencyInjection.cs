using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MovieCatalog.Application.Crawling;
using MovieCatalog.Application.Embeddings;
using MovieCatalog.Application.Movies;
using MovieCatalog.Application.Search;
using MovieCatalog.Application.Sources;

namespace MovieCatalog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<MovieService>();
        services.AddScoped<SourceService>();
        services.AddValidatorsFromAssemblyContaining(typeof(DependencyInjection));

        services.Configure<CrawlerOptions>(configuration.GetSection(CrawlerOptions.SectionName));
        services.AddScoped<IMetadataEnrichmentService, NoOpMetadataEnrichmentService>();
        services.AddScoped<CrawlerPipelineService>();
        services.AddSingleton<ICrawlCancellationRegistry, CrawlCancellationRegistry>();
        services.AddScoped<EmbeddingIndexingService>();
        services.AddScoped<SearchAnalyticsService>();

        return services;
    }
}

using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CineVector.Application.Crawling;
using CineVector.Application.Embeddings;
using CineVector.Application.Movies;
using CineVector.Application.Search;
using CineVector.Application.Sources;

namespace CineVector.Application;

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
        // ICrawlCancellationRegistry è registrato in Infrastructure (AddInfrastructure): l'implementazione di
        // produzione dipende da Redis, un dettaglio infrastrutturale che Application non deve conoscere.
        services.AddScoped<EmbeddingIndexingService>();
        services.AddScoped<SearchAnalyticsService>();

        return services;
    }
}

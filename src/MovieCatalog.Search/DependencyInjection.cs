using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MovieCatalog.Search.Clustering;
using MovieCatalog.Search.NaturalLanguage;

namespace MovieCatalog.Search;

public static class DependencyInjection
{
    public static IServiceCollection AddSearch(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SearchOptions>(configuration.GetSection(SearchOptions.SectionName));
        services.AddScoped<ISearchRankingService, WeightedSearchRankingService>();
        services.AddScoped<ISearchIntentParser, RuleBasedSearchIntentParser>();
        services.AddScoped<MovieSearchService>();
        services.AddScoped<SimilarMoviesService>();
        services.Configure<SimilarMoviesOptions>(configuration.GetSection(SimilarMoviesOptions.SectionName));
        services.AddScoped<ClusteringService>();
        services.Configure<ClusteringOptions>(configuration.GetSection(ClusteringOptions.SectionName));

        return services;
    }
}

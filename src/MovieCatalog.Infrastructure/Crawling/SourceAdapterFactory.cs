using Microsoft.Extensions.DependencyInjection;
using MovieCatalog.Application.Crawling;

namespace MovieCatalog.Infrastructure.Crawling;

/// <summary>Risolve l'adapter registrato per un AdapterType tramite keyed DI: il core del crawler (CrawlerPipelineService)
/// non conosce quali fonti esistono, solo questa factory in Infrastructure sa mappare "Tmdb" -> TmdbSourceAdapter.</summary>
public class SourceAdapterFactory(IServiceProvider serviceProvider) : ISourceAdapterFactory
{
    public ISourceAdapter? GetAdapter(string adapterType) =>
        serviceProvider.GetKeyedService<ISourceAdapter>(adapterType);
}

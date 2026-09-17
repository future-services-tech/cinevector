using Microsoft.Extensions.DependencyInjection;
using CineVector.Application.Crawling;

namespace CineVector.Infrastructure.Crawling;

/// <summary>Risolve l'adapter registrato per un AdapterType tramite keyed DI: il core del crawler (CrawlerPipelineService)
/// non conosce quali fonti esistono, solo questa factory in Infrastructure sa mappare "Tmdb" -> TmdbSourceAdapter.</summary>
public class SourceAdapterFactory(IServiceProvider serviceProvider) : ISourceAdapterFactory
{
    // Nessuna API di enumerazione nativa per i keyed service in Microsoft.Extensions.DependencyInjection:
    // questo elenco va tenuto allineato a mano con le registrazioni AddKeyedScoped<ISourceAdapter, ...> in
    // DependencyInjection.cs. Aggiungere un adapter = aggiungere una riga qui + una riga di registrazione DI.
    private static readonly string[] KnownAdapterTypes = ["Tmdb", "Omdb"];

    public ISourceAdapter? GetAdapter(string adapterType) =>
        serviceProvider.GetKeyedService<ISourceAdapter>(adapterType);

    public IReadOnlyCollection<string> GetRegisteredAdapterTypes() => KnownAdapterTypes;
}

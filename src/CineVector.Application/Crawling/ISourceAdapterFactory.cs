namespace CineVector.Application.Crawling;

public interface ISourceAdapterFactory
{
    /// <summary>Risolve l'adapter registrato per il valore di <see cref="Domain.Entities.Source.AdapterType"/> indicato, o null se non esiste.</summary>
    ISourceAdapter? GetAdapter(string adapterType);

    /// <summary>Elenco degli AdapterType realmente crawlabili (con un ISourceAdapter registrato in DI) —
    /// non include "Manual", che non ha un adapter (nessun crawling automatico, film inseriti a mano).</summary>
    IReadOnlyCollection<string> GetRegisteredAdapterTypes();
}

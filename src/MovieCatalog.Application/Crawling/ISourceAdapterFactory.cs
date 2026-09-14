namespace MovieCatalog.Application.Crawling;

public interface ISourceAdapterFactory
{
    /// <summary>Risolve l'adapter registrato per il valore di <see cref="Domain.Entities.Source.AdapterType"/> indicato, o null se non esiste.</summary>
    ISourceAdapter? GetAdapter(string adapterType);
}

using CineVector.Domain.Enums;

namespace CineVector.Application.Crawling;

/// <summary>Criterio di scoperta richiesto per un job. Popular ignora Query (nessun filtro); gli altri modi
/// richiedono un valore non vuoto in Query (titolo, o nome di attore/regista/produttore).</summary>
public record CrawlQuery(CrawlQueryMode Mode, string? Query)
{
    public static readonly CrawlQuery Popular = new(CrawlQueryMode.Popular, null);
}

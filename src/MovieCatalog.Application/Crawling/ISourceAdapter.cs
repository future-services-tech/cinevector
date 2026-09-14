namespace MovieCatalog.Application.Crawling;

/// <summary>Adapter per una singola fonte di catalogo. Il core del crawler non conosce dettagli specifici della fonte
/// (selettori HTML, endpoint API): ogni fonte implementa questa interfaccia in Infrastructure/Sources/&lt;Nome&gt;.</summary>
public interface ISourceAdapter
{
    /// <summary>Valore atteso in <see cref="Domain.Entities.Source.AdapterType"/> per selezionare questo adapter.</summary>
    string Name { get; }

    /// <summary>Scopre le pagine/risorse dei film da processare, secondo il criterio richiesto (film più popolari,
    /// o filtrati per titolo/attore/regista/produttore). Il valore restituito è l'URL pubblico della pagina
    /// del film (mai una risorsa video/stream), passato successivamente a <see cref="ExtractMovieMetadataAsync"/>.
    /// Un adapter che non supporta un determinato <see cref="CrawlQuery.Mode"/> lancia <see cref="NotSupportedException"/>.</summary>
    Task<IReadOnlyCollection<string>> DiscoverMovieUrlsAsync(CrawlQuery query, CancellationToken cancellationToken);

    /// <summary>Estrae i metadati di un singolo film dalla pagina/risorsa indicata. Restituisce null se la risorsa
    /// non è (più) un film valido (es. rimosso dalla fonte).</summary>
    Task<MovieMetadata?> ExtractMovieMetadataAsync(string url, CancellationToken cancellationToken);
}

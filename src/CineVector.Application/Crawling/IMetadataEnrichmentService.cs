namespace CineVector.Application.Crawling;

/// <summary>Arricchisce opzionalmente i metadati estratti da un adapter (es. traduzioni, generi mancanti) prima del salvataggio.
/// L'URL della piattaforma resta sempre quello scoperto dalla fonte configurata: l'enrichment non lo sovrascrive mai.</summary>
public interface IMetadataEnrichmentService
{
    Task<MovieMetadata> EnrichAsync(MovieMetadata metadata, CancellationToken cancellationToken);
}

/// <summary>Implementazione di default: nessun provider di enrichment configurato in questa fase.</summary>
public class NoOpMetadataEnrichmentService : IMetadataEnrichmentService
{
    public Task<MovieMetadata> EnrichAsync(MovieMetadata metadata, CancellationToken cancellationToken) =>
        Task.FromResult(metadata);
}

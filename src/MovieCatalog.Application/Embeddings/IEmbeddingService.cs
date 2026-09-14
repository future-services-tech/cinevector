namespace MovieCatalog.Application.Embeddings;

/// <summary>Genera embedding semantici per un testo. Il provider concreto (locale, OpenAI-compatibile, ecc.) è configurabile
/// e vive in Infrastructure: l'applicazione non dipende da un modello specifico.</summary>
public interface IEmbeddingService
{
    /// <summary>Dimensione dei vettori restituiti, definita a livello di schema (colonna pgvector).</summary>
    int Dimensions { get; }

    Task<float[]> GenerateAsync(string text, CancellationToken cancellationToken);
}

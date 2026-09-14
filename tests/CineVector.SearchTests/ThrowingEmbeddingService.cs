using CineVector.Application.Embeddings;

namespace CineVector.SearchTests;

/// <summary>Stub per i test di ricerca full-text/strutturata, che non devono mai richiedere un embedding.
/// Se venisse invocato indicherebbe un test che ha attivato la modalità semantica per errore.</summary>
public class ThrowingEmbeddingService : IEmbeddingService
{
    public int Dimensions => 384;

    public Task<float[]> GenerateAsync(string text, CancellationToken cancellationToken) =>
        throw new InvalidOperationException("IEmbeddingService non dovrebbe essere invocato dai test full-text/strutturati.");
}

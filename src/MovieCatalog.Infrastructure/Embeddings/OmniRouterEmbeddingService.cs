using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using MovieCatalog.Application.Embeddings;

namespace MovieCatalog.Infrastructure.Embeddings;

/// <summary>Client per un provider di embedding compatibile con lo schema OpenAI (POST /embeddings). Il modello
/// configurato (gemini-embedding-001 su OmniRouter) restituisce nativamente 3072 dimensioni; pgvector non supporta
/// indici HNSW/IVFFlat oltre le 2000 dimensioni, quindi il vettore viene troncato a <see cref="Dimensions"/> e
/// rinormalizzato (L2) — tecnica ufficialmente supportata dai modelli Matryoshka come questo.</summary>
public class OmniRouterEmbeddingService(HttpClient httpClient, IOptions<EmbeddingOptions> options) : IEmbeddingService
{
    public int Dimensions => options.Value.Dimensions;

    public async Task<float[]> GenerateAsync(string text, CancellationToken cancellationToken)
    {
        var response = await httpClient.PostAsJsonAsync("embeddings", new EmbeddingRequest
        {
            Model = options.Value.Model,
            Input = text
        }, cancellationToken);

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<EmbeddingResponse>(cancellationToken: cancellationToken);
        var raw = body?.Data.FirstOrDefault()?.Embedding
            ?? throw new InvalidOperationException("Risposta embedding priva del campo 'data[0].embedding'.");

        return TruncateAndNormalize(raw, Dimensions);
    }

    /// <summary>Esposto internal per essere testato direttamente senza passare da una chiamata HTTP reale.</summary>
    internal static float[] TruncateAndNormalize(float[] source, int dimensions)
    {
        if (source.Length < dimensions)
        {
            throw new InvalidOperationException(
                $"Il provider ha restituito un embedding di {source.Length} dimensioni, inferiore alle {dimensions} configurate.");
        }

        var truncated = source.Length == dimensions ? source : source[..dimensions];

        var normSquared = 0.0;
        foreach (var value in truncated)
        {
            normSquared += (double)value * value;
        }

        var norm = Math.Sqrt(normSquared);
        if (norm == 0)
        {
            return truncated;
        }

        var normalized = new float[dimensions];
        for (var i = 0; i < dimensions; i++)
        {
            normalized[i] = (float)(truncated[i] / norm);
        }

        return normalized;
    }
}

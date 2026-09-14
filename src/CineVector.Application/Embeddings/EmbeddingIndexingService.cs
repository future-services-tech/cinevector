using Microsoft.Extensions.Logging;
using CineVector.Application.Movies;

namespace CineVector.Application.Embeddings;

/// <summary>Elabora in batch i film senza embedding (mai generato, o invalidato da una modifica ai metadati).
/// In questa fase è invocato su richiesta (endpoint admin) o dal crawler dopo ogni upsert; una coda dedicata
/// con retry/backoff arriva in Fase 6 insieme al resto dell'infrastruttura a worker.</summary>
public class EmbeddingIndexingService(
    IMovieRepository repository,
    IEmbeddingService embeddingService,
    ILogger<EmbeddingIndexingService> logger)
{
    public async Task<int> ProcessPendingAsync(int batchSize, CancellationToken ct)
    {
        var pending = await repository.GetMoviesPendingEmbeddingAsync(batchSize, ct);
        var processed = 0;

        foreach (var movie in pending)
        {
            var text = movie.EmbeddingText ?? EmbeddingTextBuilder.Build(movie);
            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            try
            {
                movie.EmbeddingText = text;
                movie.Embedding = await embeddingService.GenerateAsync(text, ct);
                processed++;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Generazione embedding fallita per il film {MovieId} ('{Title}')", movie.Id, movie.Title);
            }
        }

        await repository.SaveChangesAsync(ct);

        if (processed > 0)
        {
            logger.LogInformation("Embedding generati per {Count}/{Total} film in coda", processed, pending.Count);
        }

        return processed;
    }
}

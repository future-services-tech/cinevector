using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Embeddings;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/embeddings")]
public class EmbeddingsController(EmbeddingIndexingService indexingService) : ControllerBase
{
    /// <summary>Genera gli embedding mancanti (mai calcolati, o invalidati da una modifica ai metadati).
    /// In questa fase è un'azione amministrativa sincrona; una coda dedicata arriva in Fase 6.</summary>
    [HttpPost("backfill")]
    public async Task<IActionResult> Backfill([FromQuery] int batchSize, CancellationToken ct)
    {
        var effectiveBatchSize = batchSize is < 1 or > 200 ? 50 : batchSize;
        var processed = await indexingService.ProcessPendingAsync(effectiveBatchSize, ct);
        return Ok(new { processed });
    }
}

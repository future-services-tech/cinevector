using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Crawling;
using CineVector.Application.Sources;
using CineVector.Contracts.Sources;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/sources")]
public class SourcesController(SourceService sourceService, ISourceAdapterFactory adapterFactory) : ControllerBase
{
    /// <summary>Marcatore per fonti senza crawling automatico (film inseriti a mano) — non ha un ISourceAdapter,
    /// quindi non compare tra i tipi "registrati" ma resta sempre selezionabile.</summary>
    private const string ManualAdapterType = "Manual";

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<SourceDto>>> GetAll(CancellationToken ct) =>
        Ok(await sourceService.GetAllAsync(ct));

    /// <summary>Tipi di fonte realmente configurabili oggi: quelli con un adapter registrato in DI (crawlabili)
    /// più "Manual" (nessun crawling). Il frontend costruisce il selettore da qui invece di avere un elenco
    /// fisso — aggiungere un nuovo adapter lato backend lo rende automaticamente disponibile anche in UI.</summary>
    [HttpGet("adapter-types")]
    public ActionResult<IReadOnlyCollection<string>> GetAdapterTypes() =>
        Ok(adapterFactory.GetRegisteredAdapterTypes().Append(ManualAdapterType).ToList());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SourceDto>> GetById(int id, CancellationToken ct)
    {
        var source = await sourceService.GetByIdAsync(id, ct);
        return source is null ? NotFound() : Ok(source);
    }

    [HttpPost]
    public async Task<ActionResult<SourceDto>> Create(UpsertSourceRequest request, CancellationToken ct)
    {
        if (!IsKnownAdapterType(request.AdapterType))
        {
            return BadRequest(new { error = $"AdapterType '{request.AdapterType}' non riconosciuto. Tipi validi: {string.Join(", ", adapterFactory.GetRegisteredAdapterTypes().Append(ManualAdapterType))}." });
        }

        var created = await sourceService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SourceDto>> Update(int id, UpsertSourceRequest request, CancellationToken ct)
    {
        if (!IsKnownAdapterType(request.AdapterType))
        {
            return BadRequest(new { error = $"AdapterType '{request.AdapterType}' non riconosciuto. Tipi validi: {string.Join(", ", adapterFactory.GetRegisteredAdapterTypes().Append(ManualAdapterType))}." });
        }

        var updated = await sourceService.UpdateAsync(id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    private bool IsKnownAdapterType(string adapterType) =>
        adapterType == ManualAdapterType || adapterFactory.GetRegisteredAdapterTypes().Contains(adapterType, StringComparer.OrdinalIgnoreCase);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await sourceService.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}

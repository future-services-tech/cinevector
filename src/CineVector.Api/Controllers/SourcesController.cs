using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Sources;
using CineVector.Contracts.Sources;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/sources")]
public class SourcesController(SourceService sourceService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<SourceDto>>> GetAll(CancellationToken ct) =>
        Ok(await sourceService.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SourceDto>> GetById(int id, CancellationToken ct)
    {
        var source = await sourceService.GetByIdAsync(id, ct);
        return source is null ? NotFound() : Ok(source);
    }

    [HttpPost]
    public async Task<ActionResult<SourceDto>> Create(UpsertSourceRequest request, CancellationToken ct)
    {
        var created = await sourceService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SourceDto>> Update(int id, UpsertSourceRequest request, CancellationToken ct)
    {
        var updated = await sourceService.UpdateAsync(id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await sourceService.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}

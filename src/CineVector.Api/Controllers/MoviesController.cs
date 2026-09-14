using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Movies;
using CineVector.Contracts;
using CineVector.Contracts.Movies;
using CineVector.Contracts.Search;
using CineVector.Search;

namespace CineVector.Api.Controllers;

[ApiController]
[Route("api/movies")]
public class MoviesController(
    MovieService movieService,
    SimilarMoviesService similarMoviesService,
    IValidator<UpsertMovieRequest> validator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<MovieSummaryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<MovieSummaryDto>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await movieService.GetPagedAsync(page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<MovieDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MovieDto>> GetById(int id, CancellationToken ct)
    {
        var movie = await movieService.GetByIdAsync(id, ct);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpGet("{id:int}/similar")]
    [ProducesResponseType<SimilarMoviesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SimilarMoviesResponse>> GetSimilar(
        int id,
        [FromQuery] int? maxResults,
        [FromQuery] double? minSimilarity,
        CancellationToken ct)
    {
        var response = await similarMoviesService.GetSimilarAsync(id, maxResults, minSimilarity, ct);
        return response is null
            ? NotFound(new { error = "Film non trovato o senza embedding calcolato (richiedi un backfill: POST /api/embeddings/backfill)." })
            : Ok(response);
    }

    [HttpPost]
    [ProducesResponseType<MovieDto>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MovieDto>> Create(UpsertMovieRequest request, CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        try
        {
            var created = await movieService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType<MovieDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MovieDto>> Update(int id, UpsertMovieRequest request, CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var updated = await movieService.UpdateAsync(id, request, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await movieService.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}

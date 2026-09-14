using Microsoft.AspNetCore.Mvc;
using MovieCatalog.Application.Clustering;
using MovieCatalog.Contracts.Clustering;
using MovieCatalog.Domain.Entities;
using MovieCatalog.Search.Clustering;

namespace MovieCatalog.Api.Controllers;

[ApiController]
[Route("api/clusters")]
public class ClustersController(IClusterRepository repository, ClusteringService clusteringService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ClusterDto>>> GetAll(CancellationToken ct)
    {
        var clusters = await repository.GetAllAsync(ct);
        return Ok(clusters.Select(ToDto).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClusterDto>> GetById(int id, CancellationToken ct)
    {
        var cluster = await repository.GetByIdAsync(id, ct);
        return cluster is null ? NotFound() : Ok(ToDto(cluster));
    }

    [HttpGet("{id:int}/movies")]
    public async Task<ActionResult<IReadOnlyCollection<ClusterMemberDto>>> GetMovies(int id, CancellationToken ct)
    {
        var cluster = await repository.GetByIdAsync(id, ct);
        if (cluster is null)
        {
            return NotFound();
        }

        var members = await repository.GetClusterMembersAsync(id, ct);
        return Ok(members.Select(ToMemberDto).ToList());
    }

    /// <summary>Ricalcola tutti i cluster da zero (k-means sugli embedding correnti). Azione amministrativa sincrona,
    /// da eseguire dopo crawl massicci o backfill embedding significativi.</summary>
    [HttpPost("recompute")]
    public async Task<IActionResult> Recompute(CancellationToken ct)
    {
        var count = await clusteringService.RecomputeAsync(ct);
        return Ok(new { clusters = count });
    }

    private static ClusterDto ToDto(MovieCluster cluster) => new()
    {
        Id = cluster.Id,
        Label = cluster.Label,
        Description = cluster.Description,
        MemberCount = cluster.MemberCount,
        CoordX = cluster.CoordX,
        CoordY = cluster.CoordY,
        CoordZ = cluster.CoordZ
    };

    private static ClusterMemberDto ToMemberDto(Movie movie) => new()
    {
        Id = movie.Id,
        Title = movie.Title,
        OriginalTitle = movie.OriginalTitle,
        Year = movie.Year,
        Rating = movie.Rating,
        PosterUrl = movie.PosterUrl,
        Genres = movie.Genres.Select(g => g.Genre!.Name).ToList(),
        CoordX = movie.ClusterCoordX ?? 0,
        CoordY = movie.ClusterCoordY ?? 0,
        CoordZ = movie.ClusterCoordZ ?? 0
    };
}

using Microsoft.EntityFrameworkCore;
using MovieCatalog.Application.Clustering;
using MovieCatalog.Domain.Entities;
using MovieCatalog.Infrastructure.Persistence;

namespace MovieCatalog.Infrastructure.Clustering;

public class ClusterRepository(AppDbContext db) : IClusterRepository
{
    public async Task<IReadOnlyCollection<MovieClusterSample>> GetMoviesWithEmbeddingsAsync(CancellationToken ct)
    {
        var movies = await db.Movies
            .Where(m => m.Embedding != null)
            .Include(m => m.Genres).ThenInclude(g => g.Genre)
            .Include(m => m.Keywords).ThenInclude(k => k.Keyword)
            .ToListAsync(ct);

        return movies
            .Select(m => new MovieClusterSample(
                m.Id,
                m.Embedding!,
                m.Genres.Select(g => g.Genre!.Name).ToList(),
                m.Keywords.Select(k => k.Keyword!.Name).ToList()))
            .ToList();
    }

    public async Task ReplaceAllAsync(IReadOnlyCollection<NewClusterAssignment> assignments, CancellationToken ct)
    {
        var existingClusters = await db.MovieClusters.ToListAsync(ct);
        db.MovieClusters.RemoveRange(existingClusters);

        var moviesWithCluster = await db.Movies.Where(m => m.ClusterId != null).ToListAsync(ct);
        foreach (var movie in moviesWithCluster)
        {
            movie.ClusterId = null;
            movie.ClusterCoordX = null;
            movie.ClusterCoordY = null;
            movie.ClusterCoordZ = null;
        }

        await db.SaveChangesAsync(ct);

        var now = DateTimeOffset.UtcNow;
        var assignmentList = assignments.ToList();
        var newClusters = assignmentList
            .Select(a => new MovieCluster
            {
                Label = a.Label,
                Description = a.Description,
                MemberCount = a.MemberCoordinates.Count,
                Centroid = a.Centroid,
                CoordX = a.CoordX,
                CoordY = a.CoordY,
                CoordZ = a.CoordZ,
                CreatedAt = now,
                UpdatedAt = now
            })
            .ToList();

        db.MovieClusters.AddRange(newClusters);
        await db.SaveChangesAsync(ct);

        var allMovieIds = assignmentList.SelectMany(a => a.MemberCoordinates.Keys).ToList();
        var movies = await db.Movies.Where(m => allMovieIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, ct);

        for (var i = 0; i < newClusters.Count; i++)
        {
            var cluster = newClusters[i];
            foreach (var (movieId, coord) in assignmentList[i].MemberCoordinates)
            {
                if (movies.TryGetValue(movieId, out var movie))
                {
                    movie.ClusterId = cluster.Id;
                    movie.ClusterCoordX = coord.X;
                    movie.ClusterCoordY = coord.Y;
                    movie.ClusterCoordZ = coord.Z;
                }
            }
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyCollection<MovieCluster>> GetAllAsync(CancellationToken ct) =>
        await db.MovieClusters.OrderByDescending(c => c.MemberCount).ToListAsync(ct);

    public Task<MovieCluster?> GetByIdAsync(int id, CancellationToken ct) =>
        db.MovieClusters.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IReadOnlyCollection<Movie>> GetClusterMembersAsync(int clusterId, CancellationToken ct) =>
        await db.Movies
            .Where(m => m.ClusterId == clusterId)
            .Include(m => m.Genres).ThenInclude(g => g.Genre)
            .ToListAsync(ct);
}

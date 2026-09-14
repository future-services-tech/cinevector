using CineVector.Domain.Entities;

namespace CineVector.Application.Clustering;

public interface IClusterRepository
{
    Task<IReadOnlyCollection<MovieClusterSample>> GetMoviesWithEmbeddingsAsync(CancellationToken ct);

    /// <summary>Sostituisce integralmente i cluster esistenti con quelli calcolati (ricalcolo completo, non incrementale).</summary>
    Task ReplaceAllAsync(IReadOnlyCollection<NewClusterAssignment> assignments, CancellationToken ct);

    Task<IReadOnlyCollection<MovieCluster>> GetAllAsync(CancellationToken ct);
    Task<MovieCluster?> GetByIdAsync(int id, CancellationToken ct);
    Task<IReadOnlyCollection<Movie>> GetClusterMembersAsync(int clusterId, CancellationToken ct);
}

namespace CineVector.Domain.Entities;

public class Movie
{
    public int Id { get; set; }
    public required string ExternalId { get; set; }
    public int SourceId { get; set; }
    public Source? Source { get; set; }

    public int? ClusterId { get; set; }
    public MovieCluster? Cluster { get; set; }

    /// <summary>Coordinate 3D del film all'interno del proprio cluster (PCA scoped ai soli membri del cluster),
    /// precalcolate al ricalcolo cluster per evitare di rieseguire la PCA ad ogni richiesta della mappa semantica.</summary>
    public float? ClusterCoordX { get; set; }
    public float? ClusterCoordY { get; set; }
    public float? ClusterCoordZ { get; set; }

    public required string Title { get; set; }
    public required string NormalizedTitle { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public string? Overview { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public required string PlatformUrl { get; set; }
    public string? Language { get; set; }
    public string? Country { get; set; }

    public string? MetadataHash { get; set; }
    public string? EmbeddingText { get; set; }

    /// <summary>Vettore semantico; il tipo concreto (pgvector) è mappato in Infrastructure per non accoppiare il Domain al provider DB.</summary>
    public float[]? Embedding { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }

    public ICollection<MovieCast> Cast { get; set; } = [];
    public ICollection<MovieDirector> Directors { get; set; } = [];
    public ICollection<MovieCrew> Crew { get; set; } = [];
    public ICollection<MovieGenre> Genres { get; set; } = [];
    public ICollection<MovieKeyword> Keywords { get; set; } = [];
}

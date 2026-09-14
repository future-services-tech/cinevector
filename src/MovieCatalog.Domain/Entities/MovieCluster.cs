namespace MovieCatalog.Domain.Entities;

/// <summary>Gruppo di film semanticamente vicini, calcolato via k-means sugli embedding (Application/Clustering).
/// L'etichetta e la descrizione sono generate deterministicamente dai generi/keyword più frequenti tra i film membri.</summary>
public class MovieCluster
{
    public int Id { get; set; }
    public required string Label { get; set; }
    public required string Description { get; set; }
    public int MemberCount { get; set; }

    /// <summary>Centroide k-means nello spazio di embedding (stessa dimensionalità di Movie.Embedding).</summary>
    public required float[] Centroid { get; set; }

    /// <summary>Proiezione PCA a 3 componenti del centroide, per il posizionamento nella mappa semantica 3D.</summary>
    public float CoordX { get; set; }
    public float CoordY { get; set; }
    public float CoordZ { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Movie> Movies { get; set; } = [];
}

namespace CineVector.Application.Clustering;

/// <summary>Dati minimi di un film necessari per calcolare i cluster (embedding) e la sua etichetta (generi/keyword).</summary>
public record MovieClusterSample(int MovieId, float[] Embedding, IReadOnlyCollection<string> Genres, IReadOnlyCollection<string> Keywords);

/// <summary>Un cluster calcolato, pronto per essere persistito: centroide, proiezione 3D del centroide e coordinate 3D
/// (PCA scoped al cluster) di ciascun film membro.</summary>
public record NewClusterAssignment(
    string Label,
    string Description,
    float[] Centroid,
    float CoordX,
    float CoordY,
    float CoordZ,
    IReadOnlyDictionary<int, (float X, float Y, float Z)> MemberCoordinates);

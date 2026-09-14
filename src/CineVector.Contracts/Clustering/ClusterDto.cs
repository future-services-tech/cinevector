namespace CineVector.Contracts.Clustering;

public class ClusterDto
{
    public int Id { get; set; }
    public required string Label { get; set; }
    public required string Description { get; set; }
    public int MemberCount { get; set; }
    public float CoordX { get; set; }
    public float CoordY { get; set; }
    public float CoordZ { get; set; }
}

public class ClusterMemberDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public IReadOnlyCollection<string> Genres { get; set; } = [];
    public float CoordX { get; set; }
    public float CoordY { get; set; }
    public float CoordZ { get; set; }
}

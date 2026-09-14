namespace CineVector.Contracts.Movies;

public class MovieDto
{
    public int Id { get; set; }
    public required string SourceName { get; set; }
    public required string Title { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public string? Overview { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public required string PlatformUrl { get; set; }
    public string? Language { get; set; }
    public string? Country { get; set; }

    public int? ClusterId { get; set; }
    public string? ClusterLabel { get; set; }

    public IReadOnlyCollection<string> Genres { get; set; } = [];
    public IReadOnlyCollection<string> Keywords { get; set; } = [];
    public IReadOnlyCollection<MoviePersonDto> Directors { get; set; } = [];
    public IReadOnlyCollection<MovieCastMemberDto> Cast { get; set; } = [];
    public IReadOnlyCollection<MovieCrewMemberDto> Crew { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class MovieCastMemberDto
{
    public required string Name { get; set; }
    public string? Character { get; set; }
    public int BillingOrder { get; set; }
    public string? ProfileUrl { get; set; }
    public string? WikipediaUrl { get; set; }
}

public class MovieCrewMemberDto
{
    public required string Name { get; set; }
    public required string Role { get; set; }
    public string? ProfileUrl { get; set; }
    public string? WikipediaUrl { get; set; }
}

/// <summary>Persona con foto/link Wikipedia se disponibili — oggi usato per i registi.</summary>
public class MoviePersonDto
{
    public required string Name { get; set; }
    public string? ProfileUrl { get; set; }
    public string? WikipediaUrl { get; set; }
}

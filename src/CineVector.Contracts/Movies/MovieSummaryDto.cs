namespace CineVector.Contracts.Movies;

public class MovieSummaryDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public IReadOnlyCollection<string> Genres { get; set; } = [];
}

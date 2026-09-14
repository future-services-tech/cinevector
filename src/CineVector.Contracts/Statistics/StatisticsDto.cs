namespace CineVector.Contracts.Statistics;

public class StatisticsDto
{
    public int TotalMovies { get; set; }
    public int MoviesAddedToday { get; set; }
    public int MoviesUpdatedToday { get; set; }
    public int TotalSources { get; set; }
    public DateTimeOffset? LastCrawlAt { get; set; }
    public int MoviesWithEmbedding { get; set; }
    public int MoviesPendingEmbedding { get; set; }
    public int TotalClusters { get; set; }

    public IReadOnlyCollection<NamedCountDto> ByGenre { get; set; } = [];
    public IReadOnlyCollection<NamedCountDto> ByYear { get; set; } = [];
    public IReadOnlyCollection<NamedCountDto> ByRating { get; set; } = [];
    public IReadOnlyCollection<NamedCountDto> BySource { get; set; } = [];
}

public class NamedCountDto
{
    public required string Name { get; set; }
    public int Count { get; set; }
}

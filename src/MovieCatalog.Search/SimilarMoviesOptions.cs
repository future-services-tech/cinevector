namespace MovieCatalog.Search;

public class SimilarMoviesOptions
{
    public const string SectionName = "SimilarMovies";

    public double MinSimilarity { get; set; } = 0.3;
    public int MaxResults { get; set; } = 20;

    /// <summary>Bonus additivo (0-1) proporzionale alla quota di generi condivisi col film di riferimento.</summary>
    public double GenreWeight { get; set; } = 0.10;

    /// <summary>Bonus additivo (0-1) che decade linearmente con la distanza in anni dal film di riferimento (0 oltre YearDecayRange).</summary>
    public double YearWeight { get; set; } = 0.05;
    public int YearDecayRange { get; set; } = 20;
}

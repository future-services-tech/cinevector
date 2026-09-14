namespace MovieCatalog.Search;

public class SearchOptions
{
    public const string SectionName = "Search";

    public double FullTextWeight { get; set; } = 0.35;
    public double SemanticWeight { get; set; } = 0.50;
    public double MetadataWeight { get; set; } = 0.15;
}

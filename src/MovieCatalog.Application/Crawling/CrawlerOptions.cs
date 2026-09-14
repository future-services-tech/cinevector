namespace MovieCatalog.Application.Crawling;

public class CrawlerOptions
{
    public const string SectionName = "Crawler";

    public bool Enabled { get; set; } = true;
    public int DelayMilliseconds { get; set; } = 1000;
    public int MaxConcurrency { get; set; } = 2;
}

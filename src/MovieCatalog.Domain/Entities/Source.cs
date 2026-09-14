namespace MovieCatalog.Domain.Entities;

public class Source
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string BaseUrl { get; set; }
    public bool Enabled { get; set; } = true;
    public required string AdapterType { get; set; }
    public DateTimeOffset? LastCrawlAt { get; set; }

    public ICollection<Movie> Movies { get; set; } = [];
    public ICollection<CrawlJob> CrawlJobs { get; set; } = [];
}

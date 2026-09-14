namespace MovieCatalog.Contracts.Sources;

public class SourceDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string BaseUrl { get; set; }
    public bool Enabled { get; set; }
    public required string AdapterType { get; set; }
    public DateTimeOffset? LastCrawlAt { get; set; }
}

public class UpsertSourceRequest
{
    public required string Name { get; set; }
    public required string BaseUrl { get; set; }
    public bool Enabled { get; set; } = true;
    public required string AdapterType { get; set; }
}

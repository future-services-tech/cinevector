namespace CineVector.Contracts.Crawling;

public class CrawlJobDto
{
    public int Id { get; set; }
    public int SourceId { get; set; }
    public string? SourceName { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public required string Status { get; set; }
    public required string QueryMode { get; set; }
    public string? Query { get; set; }
    public int PagesVisited { get; set; }
    public int MoviesFound { get; set; }
    public int MoviesCreated { get; set; }
    public int MoviesUpdated { get; set; }
    public IReadOnlyCollection<CrawlErrorDto> Errors { get; set; } = [];

    /// <summary>True se lo stato è Running/Paused ma nessuna istanza API attiva sta effettivamente gestendo
    /// questo job (es. l'istanza che lo eseguiva è stata riavviata): un job "zombie" da fermare manualmente.</summary>
    public bool IsOrphaned { get; set; }
}

public class CrawlErrorDto
{
    public required string Url { get; set; }
    public required string ErrorType { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

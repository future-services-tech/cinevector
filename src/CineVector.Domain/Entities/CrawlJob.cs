using CineVector.Domain.Enums;

namespace CineVector.Domain.Entities;

public class CrawlJob
{
    public int Id { get; set; }
    public int SourceId { get; set; }
    public Source? Source { get; set; }

    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public CrawlJobStatus Status { get; set; } = CrawlJobStatus.Pending;

    public CrawlQueryMode QueryMode { get; set; } = CrawlQueryMode.Popular;
    public string? Query { get; set; }

    public int PagesVisited { get; set; }
    public int MoviesFound { get; set; }
    public int MoviesCreated { get; set; }
    public int MoviesUpdated { get; set; }

    public ICollection<CrawlError> Errors { get; set; } = [];
}

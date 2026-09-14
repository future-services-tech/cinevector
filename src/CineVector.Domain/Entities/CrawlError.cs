namespace CineVector.Domain.Entities;

public class CrawlError
{
    public int Id { get; set; }
    public int CrawlJobId { get; set; }
    public CrawlJob? CrawlJob { get; set; }

    public required string Url { get; set; }
    public required string ErrorType { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

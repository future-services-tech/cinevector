namespace CineVector.Contracts.Observability;

public class LogEntryDto
{
    public DateTimeOffset Timestamp { get; set; }
    public required string Level { get; set; }
    public required string Message { get; set; }
    public string? Exception { get; set; }
}

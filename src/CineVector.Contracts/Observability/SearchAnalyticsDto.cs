namespace CineVector.Contracts.Observability;

public class SearchAnalyticsDto
{
    public int TotalSearches { get; set; }
    public double AverageDurationMs { get; set; }
    public IReadOnlyCollection<ModeCountDto> ByMode { get; set; } = [];
    public IReadOnlyCollection<QueryCountDto> TopQueries { get; set; } = [];
    public IReadOnlyCollection<VolumePointDto> VolumeOverTime { get; set; } = [];
}

public class ModeCountDto
{
    public required string Mode { get; set; }
    public int Count { get; set; }
}

public class QueryCountDto
{
    public required string Query { get; set; }
    public int Count { get; set; }
}

public class VolumePointDto
{
    public DateTimeOffset Timestamp { get; set; }
    public int Count { get; set; }
}

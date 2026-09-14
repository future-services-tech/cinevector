namespace MovieCatalog.Contracts.Observability;

public class MetricPointDto
{
    public DateTimeOffset Timestamp { get; set; }
    public double Average { get; set; }
    public double Max { get; set; }
    public long Count { get; set; }
}

public class MetricSeriesDto
{
    public required string Series { get; set; }
    public IReadOnlyCollection<MetricPointDto> Points { get; set; } = [];
}

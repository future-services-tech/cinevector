namespace MovieCatalog.Contracts.Crawling;

/// <summary>Corpo opzionale di POST /api/crawl/{sourceId}/start. Senza corpo (o con Mode="Popular") il crawler
/// scopre i film più popolari come sempre; con un altro Mode, Query è obbligatoria (titolo, o nome persona).</summary>
public class StartCrawlRequest
{
    public string Mode { get; set; } = "Popular";
    public string? Query { get; set; }
}

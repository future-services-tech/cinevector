namespace CineVector.Contracts.Search;

public class SearchResponse
{
    public string? Query { get; set; }
    public required string Mode { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }

    public IReadOnlyCollection<SearchResultItemDto> Results { get; set; } = [];
    public required SearchFacetsDto Facets { get; set; }
}

public class SearchResultItemDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public IReadOnlyCollection<string> Genres { get; set; } = [];

    /// <summary>Punteggio di rilevanza testuale (ts_rank), presente solo per query con testo libero.</summary>
    public double? Relevance { get; set; }

    /// <summary>Similarità semantica (0-1), popolata dalla Fase 4 in poi.</summary>
    public double? Similarity { get; set; }
}

public class SimilarMoviesResponse
{
    public int MovieId { get; set; }
    public IReadOnlyCollection<SearchResultItemDto> Results { get; set; } = [];
}

public class SearchFacetsDto
{
    public IReadOnlyCollection<FacetValueDto> Genres { get; set; } = [];
    public IReadOnlyCollection<FacetValueDto> Years { get; set; } = [];
    public IReadOnlyCollection<FacetValueDto> Languages { get; set; } = [];
}

public class FacetValueDto
{
    public required string Value { get; set; }
    public int Count { get; set; }
}

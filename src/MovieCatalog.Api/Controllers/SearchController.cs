using Microsoft.AspNetCore.Mvc;
using MovieCatalog.Contracts.Search;
using MovieCatalog.Search;

namespace MovieCatalog.Api.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController(MovieSearchService searchService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<SearchResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<SearchResponse>> SearchGet(
        [FromQuery] string? query,
        [FromQuery] string[]? genres,
        [FromQuery] string[]? actors,
        [FromQuery] string[]? directors,
        [FromQuery] int? yearFrom,
        [FromQuery] int? yearTo,
        [FromQuery] double? ratingFrom,
        [FromQuery] double? ratingTo,
        [FromQuery] string? language,
        [FromQuery] string? country,
        [FromQuery] bool semantic = false,
        [FromQuery] bool naturalLanguage = false,
        [FromQuery] SearchSort sort = SearchSort.Relevance,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var request = new SearchRequest
        {
            Query = query,
            Genres = genres ?? [],
            Actors = actors ?? [],
            Directors = directors ?? [],
            YearFrom = yearFrom,
            YearTo = yearTo,
            RatingFrom = ratingFrom,
            RatingTo = ratingTo,
            Language = language,
            Country = country,
            Semantic = semantic,
            NaturalLanguage = naturalLanguage,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        return Ok(await searchService.SearchAsync(request, ct));
    }

    [HttpPost]
    [ProducesResponseType<SearchResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<SearchResponse>> SearchPost(SearchRequest request, CancellationToken ct) =>
        Ok(await searchService.SearchAsync(request, ct));
}

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using CineVector.Contracts.Search;
using CineVector.Infrastructure.Search;
using CineVector.Search;
using CineVector.Search.NaturalLanguage;
using Xunit;

namespace CineVector.SearchTests;

[Collection("Search")]
public class MovieSearchRepositoryTests(SearchTestFixture fixture)
{
    private MovieSearchService CreateService()
    {
        var db = fixture.CreateDbContext();
        var repository = new MovieSearchRepository(db);
        var searchLogRepository = new SearchLogRepository(db);
        var ranking = new WeightedSearchRankingService(Options.Create(new SearchOptions()));
        var intentParser = new RuleBasedSearchIntentParser();
        return new MovieSearchService(repository, ranking, new ThrowingEmbeddingService(), intentParser, searchLogRepository, NullLogger<MovieSearchService>.Instance);
    }

    [Fact]
    public async Task Search_ExactTitle_ReturnsMovie()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "Interstellar" }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Interstellar", response.Results.Single().Title);
        Assert.Equal("fulltext", response.Mode);
    }

    [Fact]
    public async Task Search_PartialTitle_ReturnsMovie()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "Schindler" }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Schindler's List", response.Results.Single().Title);
    }

    [Fact]
    public async Task Search_ByDirectorName_ReturnsBothNolanMovies()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "Nolan" }, default);

        Assert.Equal(2, response.Total);
        Assert.Contains(response.Results, m => m.Title == "Interstellar");
        Assert.Contains(response.Results, m => m.Title == "Inception");
    }

    [Fact]
    public async Task Search_ByActorName_ReturnsMovie()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "DiCaprio" }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Inception", response.Results.Single().Title);
    }

    [Fact]
    public async Task Search_ByPlotKeyword_ReturnsMovie()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "wormhole" }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Interstellar", response.Results.Single().Title);
    }

    /// <summary>Documenta un limite noto della Fase 2: la ricerca full-text è lessicale, non semantica.
    /// Una query in italiano non trova un film con trama in inglese anche se il significato coincide
    /// ("second chance" / "seconda possibilità") — questo caso sarà risolto dalla ricerca semantica in Fase 4.</summary>
    [Fact]
    public async Task Search_TranslatedPlotKeyword_NoLexicalMatch()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "seconda possibilita" }, default);

        Assert.Equal(0, response.Total);
    }

    [Fact]
    public async Task Search_StructuredGenreFilter_ReturnsOnlyMatchingGenre()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Genres = ["Romance"] }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Second Chances", response.Results.Single().Title);
        Assert.Equal("structured", response.Mode);
    }

    [Fact]
    public async Task Search_StructuredRatingFilter_ExcludesLowerRatedMovies()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { RatingFrom = 8.5 }, default);

        Assert.Equal(2, response.Total);
        Assert.All(response.Results, m => Assert.True(m.Rating >= 8.5));
    }

    [Fact]
    public async Task Search_YearRangeFilter_ReturnsMoviesWithinRange()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { YearFrom = 2010, YearTo = 2014 }, default);

        Assert.Equal(2, response.Total);
        Assert.All(response.Results, m => Assert.InRange(m.Year!.Value, 2010, 2014));
    }

    [Fact]
    public async Task Search_CombinedTextAndStructuredFilter_NarrowsResults()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "Nolan", Genres = ["Adventure"] }, default);

        Assert.Equal(1, response.Total);
        Assert.Equal("Interstellar", response.Results.Single().Title);
        Assert.Equal("fulltext+structured", response.Mode);
    }

    [Fact]
    public async Task Search_NoMatch_ReturnsEmptyResult()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "xyzqwertynonexistent" }, default);

        Assert.Equal(0, response.Total);
        Assert.Empty(response.Results);
    }

    [Fact]
    public async Task Search_ReturnsGenreFacets()
    {
        var response = await CreateService().SearchAsync(new SearchRequest { Query = "Nolan" }, default);

        Assert.Contains(response.Facets.Genres, f => f.Value == "Science Fiction" && f.Count == 2);
    }
}

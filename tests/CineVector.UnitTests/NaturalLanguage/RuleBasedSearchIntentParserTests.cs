using CineVector.Search.NaturalLanguage;
using Xunit;

namespace CineVector.UnitTests.NaturalLanguage;

public class RuleBasedSearchIntentParserTests
{
    private readonly RuleBasedSearchIntentParser _parser = new();

    [Fact]
    public void Parse_GenreAndYearRange_ExtractsBoth()
    {
        var intent = _parser.Parse("film di fantascienza dal 2020 al 2025");

        Assert.Contains("Fantascienza", intent.Genres);
        Assert.Contains("Science Fiction", intent.Genres);
        Assert.Equal(2020, intent.YearFrom);
        Assert.Equal(2025, intent.YearTo);
    }

    [Fact]
    public void Parse_ActorAndCountry_ExtractsBoth()
    {
        var intent = _parser.Parse("film con Tom Hanks ambientati in Italia");

        Assert.Contains("Tom Hanks", intent.Actors);
        Assert.Equal("Italia", intent.Country);
    }

    [Fact]
    public void Parse_GenreAndRatingThreshold_ExtractsBoth()
    {
        var intent = _parser.Parse("thriller psicologici con valutazione superiore a 7");

        Assert.Contains("Thriller", intent.Genres);
        Assert.Equal(7, intent.RatingMin);
    }

    [Fact]
    public void Parse_GenreWithResidualText_KeepsResidualAsSemanticQuery()
    {
        var intent = _parser.Parse("commedie romantiche sulla seconda possibilità");

        Assert.Contains("Commedia", intent.Genres);
        Assert.Contains("Romance", intent.Genres);
        Assert.NotNull(intent.TextQuery);
        Assert.Contains("seconda possibilit", intent.TextQuery, StringComparison.OrdinalIgnoreCase);
        Assert.True(intent.Semantic);
    }

    [Fact]
    public void Parse_PureStructuredQuery_HasNoResidualTextAndIsNotSemantic()
    {
        var intent = _parser.Parse("film di fantascienza dal 2020 al 2025");

        Assert.Null(intent.TextQuery);
        Assert.False(intent.Semantic);
    }

    [Fact]
    public void Parse_DirectorPhrase_ExtractsDirector()
    {
        var intent = _parser.Parse("un film diretto da Christopher Nolan");

        Assert.Contains("Christopher Nolan", intent.Directors);
    }

    [Fact]
    public void Parse_ExactYear_SetsFromAndToToSameYear()
    {
        var intent = _parser.Parse("un film del 2010");

        Assert.Equal(2010, intent.YearFrom);
        Assert.Equal(2010, intent.YearTo);
    }
}

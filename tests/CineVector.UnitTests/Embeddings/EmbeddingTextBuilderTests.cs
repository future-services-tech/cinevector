using CineVector.Application.Embeddings;
using CineVector.Domain.Entities;
using Xunit;

namespace CineVector.UnitTests.Embeddings;

public class EmbeddingTextBuilderTests
{
    private static Movie SampleMovie()
    {
        var director = new Person { Id = 1, Name = "Christopher Nolan", NormalizedName = "christopher nolan" };
        var actor = new Person { Id = 2, Name = "Matthew McConaughey", NormalizedName = "matthew mcconaughey" };
        var genre = new Genre { Id = 1, Name = "Science Fiction", NormalizedName = "science fiction" };
        var keyword = new Keyword { Id = 1, Name = "space travel", NormalizedName = "space travel" };

        var movie = new Movie
        {
            Id = 1,
            ExternalId = "1",
            SourceId = 1,
            Title = "Interstellar",
            NormalizedTitle = "interstellar",
            OriginalTitle = "Interstellar",
            Year = 2014,
            Overview = "A team of explorers travel through a wormhole in space.",
            PlatformUrl = "https://example.com/movie/1"
        };

        movie.Genres.Add(new MovieGenre { Movie = movie, Genre = genre });
        movie.Keywords.Add(new MovieKeyword { Movie = movie, Keyword = keyword });
        movie.Directors.Add(new MovieDirector { Movie = movie, Person = director });
        movie.Cast.Add(new MovieCast { Movie = movie, Person = actor, Character = "Cooper", BillingOrder = 0 });

        return movie;
    }

    [Fact]
    public void Build_IncludesAllPopulatedSections()
    {
        var text = EmbeddingTextBuilder.Build(SampleMovie());

        Assert.Contains("Title:\nInterstellar", text);
        Assert.Contains("Year:\n2014", text);
        Assert.Contains("Genres:\nScience Fiction", text);
        Assert.Contains("Overview:\nA team of explorers", text);
        Assert.Contains("Cast:\nMatthew McConaughey", text);
        Assert.Contains("Directors:\nChristopher Nolan", text);
        Assert.Contains("Keywords:\nspace travel", text);
    }

    [Fact]
    public void Build_OmitsSectionsWithNoData()
    {
        var movie = SampleMovie();
        movie.Overview = null;

        var text = EmbeddingTextBuilder.Build(movie);

        Assert.DoesNotContain("Overview:", text);
    }

    [Fact]
    public void Build_SameInput_IsDeterministic()
    {
        var a = EmbeddingTextBuilder.Build(SampleMovie());
        var b = EmbeddingTextBuilder.Build(SampleMovie());

        Assert.Equal(a, b);
    }
}

using MovieCatalog.Application.Movies;
using MovieCatalog.Contracts.Movies;
using Xunit;

namespace MovieCatalog.UnitTests.Movies;

public class UpsertMovieRequestValidatorTests
{
    private readonly UpsertMovieRequestValidator _validator = new();

    private static UpsertMovieRequest ValidRequest() => new()
    {
        SourceName = "TMDb",
        ExternalId = "157336",
        Title = "Interstellar",
        PlatformUrl = "https://www.themoviedb.org/movie/157336",
        Year = 2014,
        Rating = 8.4
    };

    [Fact]
    public void Validate_ValidRequest_Succeeds()
    {
        var result = _validator.Validate(ValidRequest());

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-url")]
    [InlineData("ftp://example.com/movie/1")]
    public void Validate_InvalidPlatformUrl_Fails(string platformUrl)
    {
        var request = ValidRequest();
        request.PlatformUrl = platformUrl;

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpsertMovieRequest.PlatformUrl));
    }

    [Fact]
    public void Validate_MissingTitle_Fails()
    {
        var request = ValidRequest();
        request.Title = "";

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpsertMovieRequest.Title));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(10.5)]
    public void Validate_RatingOutOfRange_Fails(double rating)
    {
        var request = ValidRequest();
        request.Rating = rating;

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpsertMovieRequest.Rating));
    }

    [Fact]
    public void Validate_YearTooFarInFuture_Fails()
    {
        var request = ValidRequest();
        request.Year = DateTime.UtcNow.Year + 50;

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpsertMovieRequest.Year));
    }
}

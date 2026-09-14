using CineVector.Infrastructure.Crawling;
using Xunit;

namespace CineVector.UnitTests.Crawling;

public class UrlCanonicalizerTests
{
    private readonly UrlCanonicalizer _canonicalizer = new();

    [Theory]
    [InlineData("https://example.com/movie/123", "https://example.com/movie/123")]
    [InlineData("https://example.com/movie/123/", "https://example.com/movie/123")]
    [InlineData("https://example.com/movie/123?utm_source=x", "https://example.com/movie/123")]
    [InlineData("https://EXAMPLE.com/movie/123", "https://example.com/movie/123")]
    [InlineData("https://example.com/movie/123#trailer", "https://example.com/movie/123")]
    public void Canonicalize_NormalizesEquivalentUrls(string input, string expected)
    {
        Assert.Equal(expected, _canonicalizer.Canonicalize(input));
    }

    [Theory]
    [InlineData("https://example.com/video.m3u8")]
    [InlineData("https://example.com/video.mp4")]
    [InlineData("blob:https://example.com/abcd")]
    [InlineData("player://example.com/movie/123")]
    [InlineData("stream://example.com/movie/123")]
    [InlineData("download://example.com/movie/123")]
    [InlineData("ftp://example.com/movie/123")]
    [InlineData("not a url")]
    [InlineData("")]
    public void Canonicalize_RejectsMediaAndNonHttpUrls(string input)
    {
        Assert.Null(_canonicalizer.Canonicalize(input));
    }

    [Fact]
    public void Canonicalize_DifferentQueryStrings_ProduceSameCanonicalUrl()
    {
        var a = _canonicalizer.Canonicalize("https://example.com/movie/123?ref=home");
        var b = _canonicalizer.Canonicalize("https://example.com/movie/123?ref=search");

        Assert.Equal(a, b);
    }
}

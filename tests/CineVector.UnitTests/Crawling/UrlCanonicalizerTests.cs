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

    [Theory]
    [InlineData("http://localhost/movie/123")]
    [InlineData("http://LOCALHOST/movie/123")]
    [InlineData("http://127.0.0.1/movie/123")]
    [InlineData("http://127.1.2.3/movie/123")]
    [InlineData("http://10.0.0.5/movie/123")]
    [InlineData("http://172.16.5.1/movie/123")]
    [InlineData("http://172.31.255.255/movie/123")]
    [InlineData("http://192.168.1.1/movie/123")]
    [InlineData("http://169.254.169.254/latest/meta-data")]
    [InlineData("http://0.0.0.0/movie/123")]
    [InlineData("http://[::1]/movie/123")]
    [InlineData("http://[fe80::1]/movie/123")]
    [InlineData("http://[fc00::1]/movie/123")]
    public void Canonicalize_RejectsPrivateAndLoopbackHosts(string input)
    {
        Assert.Null(_canonicalizer.Canonicalize(input));
    }

    [Theory]
    [InlineData("http://172.15.255.255/movie/123")] // appena fuori dal blocco 172.16.0.0/12
    [InlineData("http://172.32.0.1/movie/123")]
    [InlineData("http://1.2.3.4/movie/123")]
    [InlineData("http://8.8.8.8/movie/123")]
    public void Canonicalize_AllowsPublicIpHosts(string input)
    {
        Assert.NotNull(_canonicalizer.Canonicalize(input));
    }
}

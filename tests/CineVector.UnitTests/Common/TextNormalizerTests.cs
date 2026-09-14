using CineVector.Application.Common;
using Xunit;

namespace CineVector.UnitTests.Common;

public class TextNormalizerTests
{
    [Theory]
    [InlineData("Christopher Nolan", "christopher nolan")]
    [InlineData("  Amélie  ", "amelie")]
    [InlineData("Kärlek och Anarki", "karlek och anarki")]
    [InlineData("SCIENCE FICTION", "science fiction")]
    public void Normalize_RemovesAccentsAndCase(string input, string expected)
    {
        Assert.Equal(expected, TextNormalizer.Normalize(input));
    }

    [Fact]
    public void Normalize_SameNameDifferentCasingAndAccents_ProducesSameResult()
    {
        var a = TextNormalizer.Normalize("François Truffaut");
        var b = TextNormalizer.Normalize("francois truffaut");

        Assert.Equal(a, b);
    }
}

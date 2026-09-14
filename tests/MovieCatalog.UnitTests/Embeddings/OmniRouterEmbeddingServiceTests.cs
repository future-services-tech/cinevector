using MovieCatalog.Infrastructure.Embeddings;
using Xunit;

namespace MovieCatalog.UnitTests.Embeddings;

public class OmniRouterEmbeddingServiceTests
{
    [Fact]
    public void TruncateAndNormalize_ReturnsUnitVector()
    {
        var source = new float[] { 3, 4, 0, 0 };

        var result = OmniRouterEmbeddingService.TruncateAndNormalize(source, 4);

        var norm = Math.Sqrt(result.Sum(v => (double)v * v));
        Assert.Equal(1.0, norm, precision: 5);
    }

    [Fact]
    public void TruncateAndNormalize_TruncatesToRequestedDimensions()
    {
        var source = Enumerable.Range(0, 3072).Select(i => (float)i).ToArray();

        var result = OmniRouterEmbeddingService.TruncateAndNormalize(source, 384);

        Assert.Equal(384, result.Length);
    }

    [Fact]
    public void TruncateAndNormalize_PreservesDirection()
    {
        var source = new float[] { 1, 2, 3, 4 };

        var result = OmniRouterEmbeddingService.TruncateAndNormalize(source, 4);

        // Ogni componente deve mantenere lo stesso segno/proporzione relativa dell'originale.
        for (var i = 1; i < result.Length; i++)
        {
            var expectedRatio = source[i] / source[0];
            var actualRatio = result[i] / result[0];
            Assert.Equal(expectedRatio, actualRatio, precision: 4);
        }
    }

    [Fact]
    public void TruncateAndNormalize_SourceShorterThanTarget_Throws()
    {
        var source = new float[] { 1, 2 };

        Assert.Throws<InvalidOperationException>(() => OmniRouterEmbeddingService.TruncateAndNormalize(source, 4));
    }
}

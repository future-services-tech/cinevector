using MovieCatalog.Search.Clustering;
using Xunit;

namespace MovieCatalog.UnitTests.Clustering;

public class PcaProjectorTests
{
    [Fact]
    public void ProjectTo3D_EmptyInput_ReturnsEmpty()
    {
        var result = PcaProjector.ProjectTo3D([]);

        Assert.Empty(result);
    }

    [Fact]
    public void ProjectTo3D_SinglePoint_ReturnsOneCoordinateWithoutThrowing()
    {
        var result = PcaProjector.ProjectTo3D([[1f, 2f, 3f, 4f]]);

        Assert.Single(result);
        Assert.Equal(3, result[0].Length);
    }

    [Fact]
    public void ProjectTo3D_ReturnsOneCoordinatePerInputPoint()
    {
        List<float[]> points =
        [
            [1f, 0f, 0f, 0f],
            [0.9f, 0.1f, 0f, 0f],
            [0f, 0f, 1f, 0f],
            [0f, 0f, 0.9f, 0.1f],
        ];

        var result = PcaProjector.ProjectTo3D(points);

        Assert.Equal(points.Count, result.Length);
        Assert.All(result, coord => Assert.Equal(3, coord.Length));
    }

    [Fact]
    public void ProjectTo3D_TwoDistantGroups_PreservesRelativeSeparationInProjectedSpace()
    {
        float[] a1 = [10f, 0f, 0f, 0f];
        float[] a2 = [10.1f, 0.05f, 0f, 0f];
        float[] a3 = [9.9f, -0.05f, 0f, 0f];
        float[] b1 = [-10f, 0f, 0f, 0f];
        float[] b2 = [-10.1f, 0.05f, 0f, 0f];
        float[] b3 = [-9.9f, -0.05f, 0f, 0f];

        var groupA = new[] { a1, a2, a3 };
        var groupB = new[] { b1, b2, b3 };

        var points = groupA.Concat(groupB).ToList();
        var projected = PcaProjector.ProjectTo3D(points);

        double WithinGroupDistance(IEnumerable<float[]> group) =>
            group.Zip(group.Skip(1)).Average(pair => Distance(pair.First, pair.Second));

        var withinA = WithinGroupDistance(projected.Take(3));
        var withinB = WithinGroupDistance(projected.Skip(3).Take(3));
        var betweenGroups = Distance(projected[0], projected[3]);

        Assert.True(betweenGroups > withinA * 10, $"between={betweenGroups}, withinA={withinA}");
        Assert.True(betweenGroups > withinB * 10, $"between={betweenGroups}, withinB={withinB}");
    }

    private static double Distance(float[] a, float[] b)
    {
        double sum = 0;
        for (var i = 0; i < a.Length; i++)
        {
            var diff = a[i] - b[i];
            sum += diff * diff;
        }

        return Math.Sqrt(sum);
    }
}

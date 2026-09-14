using CineVector.Search.Clustering;
using Xunit;

namespace CineVector.UnitTests.Clustering;

public class KMeansTests
{
    private static float[] Normalize(float[] v)
    {
        var norm = MathF.Sqrt(v.Sum(x => x * x));
        return v.Select(x => x / norm).ToArray();
    }

    [Fact]
    public void Fit_TwoWellSeparatedGroups_AssignsEachGroupToItsOwnCluster()
    {
        var groupA = new[]
        {
            Normalize([1f, 0.02f, 0f, 0f]),
            Normalize([0.98f, 0.05f, 0.01f, 0f]),
            Normalize([1f, -0.01f, 0.02f, 0f]),
        };

        var groupB = new[]
        {
            Normalize([0f, 0f, 1f, 0.02f]),
            Normalize([0.01f, 0f, 0.98f, 0.05f]),
            Normalize([0f, 0.02f, 1f, -0.01f]),
        };

        var points = groupA.Concat(groupB).ToList();

        var result = KMeans.Fit(points, k: 2, maxIterations: 50);

        var groupAAssignments = result.Assignments.Take(3).Distinct().ToList();
        var groupBAssignments = result.Assignments.Skip(3).Take(3).Distinct().ToList();

        Assert.Single(groupAAssignments);
        Assert.Single(groupBAssignments);
        Assert.NotEqual(groupAAssignments[0], groupBAssignments[0]);
    }

    [Fact]
    public void Fit_KGreaterThanPointCount_ClampsWithoutThrowing()
    {
        var points = new List<float[]> { Normalize([1f, 0f]), Normalize([0f, 1f]) };

        var result = KMeans.Fit(points, k: 10, maxIterations: 10);

        Assert.Equal(2, result.Assignments.Length);
        Assert.True(result.Centroids.Length <= 2);
    }

    [Fact]
    public void Fit_EmptyInput_ReturnsEmptyResult()
    {
        var result = KMeans.Fit([], k: 3);

        Assert.Empty(result.Assignments);
        Assert.Empty(result.Centroids);
    }

    [Fact]
    public void Fit_CentroidsAreUnitNormalized()
    {
        var points = new List<float[]>
        {
            Normalize([1f, 0f, 0f]),
            Normalize([0.9f, 0.1f, 0f]),
            Normalize([0f, 1f, 0f]),
            Normalize([0f, 0.9f, 0.1f]),
        };

        var result = KMeans.Fit(points, k: 2, maxIterations: 50);

        foreach (var centroid in result.Centroids)
        {
            var norm = Math.Sqrt(centroid.Sum(x => (double)x * x));
            Assert.Equal(1.0, norm, precision: 3);
        }
    }
}

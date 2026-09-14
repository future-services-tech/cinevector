namespace CineVector.Search.Clustering;

public record KMeansResult(int[] Assignments, float[][] Centroids);

/// <summary>K-means su vettori L2-normalizzati (i nostri embedding lo sono sempre, vedi OmniRouterEmbeddingService):
/// su vettori unitari la distanza euclidea al quadrato è una funzione monotona della similarità coseno
/// (||a-b||² = 2 - 2·cos(a,b)), quindi minimizzare la distanza euclidea equivale a massimizzare la similarità coseno,
/// permettendo di usare la formula standard del centroide (media aritmetica) invece di una media sferica.</summary>
public static class KMeans
{
    public static KMeansResult Fit(IReadOnlyList<float[]> points, int k, int maxIterations = 100, int seed = 42)
    {
        if (points.Count == 0)
        {
            return new KMeansResult([], []);
        }

        k = Math.Min(k, points.Count);
        var random = new Random(seed);
        var dimensions = points[0].Length;

        var centroids = InitializeCentroidsPlusPlus(points, k, random);
        var assignments = new int[points.Count];

        for (var iteration = 0; iteration < maxIterations; iteration++)
        {
            var changed = false;

            for (var i = 0; i < points.Count; i++)
            {
                var nearest = NearestCentroid(points[i], centroids);
                if (assignments[i] != nearest)
                {
                    assignments[i] = nearest;
                    changed = true;
                }
            }

            var sums = new double[k][];
            var counts = new int[k];
            for (var c = 0; c < k; c++)
            {
                sums[c] = new double[dimensions];
            }

            for (var i = 0; i < points.Count; i++)
            {
                var cluster = assignments[i];
                counts[cluster]++;
                var point = points[i];
                for (var d = 0; d < dimensions; d++)
                {
                    sums[cluster][d] += point[d];
                }
            }

            for (var c = 0; c < k; c++)
            {
                if (counts[c] == 0)
                {
                    continue;
                }

                var newCentroid = new float[dimensions];
                for (var d = 0; d < dimensions; d++)
                {
                    newCentroid[d] = (float)(sums[c][d] / counts[c]);
                }

                centroids[c] = Normalize(newCentroid);
            }

            if (!changed && iteration > 0)
            {
                break;
            }
        }

        return new KMeansResult(assignments, centroids);
    }

    private static float[][] InitializeCentroidsPlusPlus(IReadOnlyList<float[]> points, int k, Random random)
    {
        var centroids = new float[k][];
        centroids[0] = points[random.Next(points.Count)];

        var distances = new double[points.Count];

        for (var c = 1; c < k; c++)
        {
            double total = 0;
            for (var i = 0; i < points.Count; i++)
            {
                distances[i] = points.Count > 0 ? SquaredDistanceToNearest(points[i], centroids, c) : 0;
                total += distances[i];
            }

            var threshold = random.NextDouble() * total;
            double cumulative = 0;
            var chosen = points.Count - 1;
            for (var i = 0; i < points.Count; i++)
            {
                cumulative += distances[i];
                if (cumulative >= threshold)
                {
                    chosen = i;
                    break;
                }
            }

            centroids[c] = points[chosen];
        }

        return centroids;
    }

    private static double SquaredDistanceToNearest(float[] point, float[][] centroids, int countInitialized)
    {
        var min = double.MaxValue;
        for (var c = 0; c < countInitialized; c++)
        {
            var d = SquaredDistance(point, centroids[c]);
            if (d < min)
            {
                min = d;
            }
        }

        return min;
    }

    private static int NearestCentroid(float[] point, float[][] centroids)
    {
        var best = 0;
        var bestDistance = double.MaxValue;

        for (var c = 0; c < centroids.Length; c++)
        {
            var d = SquaredDistance(point, centroids[c]);
            if (d < bestDistance)
            {
                bestDistance = d;
                best = c;
            }
        }

        return best;
    }

    private static double SquaredDistance(float[] a, float[] b)
    {
        double sum = 0;
        for (var i = 0; i < a.Length; i++)
        {
            var diff = a[i] - b[i];
            sum += diff * diff;
        }

        return sum;
    }

    private static float[] Normalize(float[] vector)
    {
        double normSquared = 0;
        foreach (var v in vector)
        {
            normSquared += (double)v * v;
        }

        var norm = Math.Sqrt(normSquared);
        if (norm == 0)
        {
            return vector;
        }

        var result = new float[vector.Length];
        for (var i = 0; i < vector.Length; i++)
        {
            result[i] = (float)(vector[i] / norm);
        }

        return result;
    }
}

namespace MovieCatalog.Search.Clustering;

/// <summary>PCA a 3 componenti implementata con power iteration e deflazione, senza dipendenze da librerie ML esterne:
/// per poche migliaia di punti e qualche centinaio di dimensioni (i nostri embedding troncati) è più che sufficiente,
/// ed evita di introdurre un'intera libreria di algebra lineare per un solo calcolo, eseguito solo al ricalcolo cluster.</summary>
public static class PcaProjector
{
    private const int Components = 3;

    public static float[][] ProjectTo3D(IReadOnlyList<float[]> points, int maxPowerIterations = 200, int seed = 7)
    {
        if (points.Count == 0)
        {
            return [];
        }

        var n = points.Count;
        var d = points[0].Length;

        var mean = new double[d];
        foreach (var point in points)
        {
            for (var j = 0; j < d; j++)
            {
                mean[j] += point[j];
            }
        }

        for (var j = 0; j < d; j++)
        {
            mean[j] /= n;
        }

        var centered = new double[n][];
        for (var i = 0; i < n; i++)
        {
            centered[i] = new double[d];
            for (var j = 0; j < d; j++)
            {
                centered[i][j] = points[i][j] - mean[j];
            }
        }

        var covariance = BuildCovariance(centered, n, d);
        var random = new Random(seed);
        var componentCount = Math.Min(Components, d);
        var eigenvectors = new double[componentCount][];

        for (var c = 0; c < componentCount; c++)
        {
            var vector = PowerIteration(covariance, d, random, maxPowerIterations);
            eigenvectors[c] = vector;
            Deflate(covariance, vector, d);
        }

        var result = new float[n][];
        for (var i = 0; i < n; i++)
        {
            var coords = new float[Components];
            for (var c = 0; c < componentCount; c++)
            {
                coords[c] = (float)Dot(centered[i], eigenvectors[c]);
            }

            result[i] = coords;
        }

        return result;
    }

    private static double[][] BuildCovariance(double[][] centered, int n, int d)
    {
        var covariance = new double[d][];
        for (var i = 0; i < d; i++)
        {
            covariance[i] = new double[d];
        }

        foreach (var row in centered)
        {
            for (var i = 0; i < d; i++)
            {
                if (row[i] == 0)
                {
                    continue;
                }

                for (var j = i; j < d; j++)
                {
                    covariance[i][j] += row[i] * row[j];
                }
            }
        }

        for (var i = 0; i < d; i++)
        {
            for (var j = i; j < d; j++)
            {
                covariance[i][j] /= n;
                covariance[j][i] = covariance[i][j];
            }
        }

        return covariance;
    }

    private static double[] PowerIteration(double[][] matrix, int d, Random random, int maxIterations)
    {
        var vector = new double[d];
        for (var i = 0; i < d; i++)
        {
            vector[i] = random.NextDouble() - 0.5;
        }

        NormalizeInPlace(vector);

        for (var iter = 0; iter < maxIterations; iter++)
        {
            var next = MultiplyMatrixVector(matrix, vector, d);
            var norm = NormalizeInPlace(next);

            if (norm < 1e-12)
            {
                break;
            }

            var diff = 0.0;
            for (var i = 0; i < d; i++)
            {
                diff += Math.Abs(next[i] - vector[i]);
            }

            vector = next;

            if (diff < 1e-9)
            {
                break;
            }
        }

        return vector;
    }

    private static void Deflate(double[][] matrix, double[] eigenvector, int d)
    {
        var mv = MultiplyMatrixVector(matrix, eigenvector, d);
        var eigenvalue = Dot(mv, eigenvector);

        for (var i = 0; i < d; i++)
        {
            for (var j = 0; j < d; j++)
            {
                matrix[i][j] -= eigenvalue * eigenvector[i] * eigenvector[j];
            }
        }
    }

    private static double[] MultiplyMatrixVector(double[][] matrix, double[] vector, int d)
    {
        var result = new double[d];
        for (var i = 0; i < d; i++)
        {
            double sum = 0;
            var row = matrix[i];
            for (var j = 0; j < d; j++)
            {
                sum += row[j] * vector[j];
            }

            result[i] = sum;
        }

        return result;
    }

    private static double NormalizeInPlace(double[] vector)
    {
        var normSquared = vector.Sum(v => v * v);
        var norm = Math.Sqrt(normSquared);
        if (norm < 1e-12)
        {
            return 0;
        }

        for (var i = 0; i < vector.Length; i++)
        {
            vector[i] /= norm;
        }

        return norm;
    }

    private static double Dot(double[] a, double[] b)
    {
        double sum = 0;
        for (var i = 0; i < a.Length; i++)
        {
            sum += a[i] * b[i];
        }

        return sum;
    }
}

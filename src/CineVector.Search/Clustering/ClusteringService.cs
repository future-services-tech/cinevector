using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CineVector.Application.Clustering;

namespace CineVector.Search.Clustering;

/// <summary>Orchestratore del ricalcolo cluster: k-means sugli embedding + etichettatura automatica (generi/keyword
/// più frequenti tra i membri, nessun dato inventato) + proiezione PCA 3D per centroidi e film membri.
/// Azione amministrativa sincrona (come il backfill embedding), da richiamare dopo crawl massicci.</summary>
public class ClusteringService(
    IClusterRepository repository,
    IOptions<ClusteringOptions> options,
    ILogger<ClusteringService> logger)
{
    public async Task<int> RecomputeAsync(CancellationToken ct)
    {
        var samples = await repository.GetMoviesWithEmbeddingsAsync(ct);
        if (samples.Count < 2)
        {
            logger.LogWarning("Ricalcolo cluster saltato: solo {Count} film con embedding disponibile (minimo 2)", samples.Count);
            return 0;
        }

        var opts = options.Value;
        var k = Math.Max(1, Math.Min(opts.K, samples.Count));

        var sampleList = samples.ToList();
        var embeddings = sampleList.Select(s => s.Embedding).ToList();
        var kMeansResult = KMeans.Fit(embeddings, k, opts.MaxIterations);

        var groups = sampleList
            .Select((sample, index) => (sample, cluster: kMeansResult.Assignments[index]))
            .GroupBy(x => x.cluster)
            .Where(g => g.Any())
            .ToList();

        var centroids = groups.Select(g => kMeansResult.Centroids[g.Key]).ToList();
        var centroidCoords = PcaProjector.ProjectTo3D(centroids);

        var assignments = new List<NewClusterAssignment>();

        for (var i = 0; i < groups.Count; i++)
        {
            var members = groups[i].Select(x => x.sample).ToList();
            var memberEmbeddings = members.Select(m => m.Embedding).ToList();
            var memberCoords = PcaProjector.ProjectTo3D(memberEmbeddings);

            var memberCoordinates = new Dictionary<int, (float X, float Y, float Z)>();
            for (var m = 0; m < members.Count; m++)
            {
                var coord = memberCoords[m];
                memberCoordinates[members[m].MovieId] = (coord[0], coord[1], coord.Length > 2 ? coord[2] : 0f);
            }

            var (label, description) = BuildLabel(members, opts);
            var centroidCoord = centroidCoords[i];

            assignments.Add(new NewClusterAssignment(
                label,
                description,
                centroids[i],
                centroidCoord[0],
                centroidCoord[1],
                centroidCoord.Length > 2 ? centroidCoord[2] : 0f,
                memberCoordinates));
        }

        await repository.ReplaceAllAsync(assignments, ct);

        logger.LogInformation("Ricalcolo cluster completato: {ClusterCount} cluster su {MovieCount} film", assignments.Count, sampleList.Count);
        return assignments.Count;
    }

    private static (string Label, string Description) BuildLabel(IReadOnlyList<MovieClusterSample> members, ClusteringOptions opts)
    {
        var topGenres = members
            .SelectMany(m => m.Genres)
            .GroupBy(g => g, StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(g => g.Count())
            .Take(opts.LabelGenreCount)
            .Select(g => g.Key)
            .ToList();

        var topKeywords = members
            .SelectMany(m => m.Keywords)
            .GroupBy(k => k, StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(k => k.Count())
            .Take(opts.LabelKeywordCount)
            .Select(k => k.Key)
            .ToList();

        var label = topGenres.Count > 0
            ? string.Join(" & ", topGenres)
            : topKeywords.Count > 0
                ? string.Join(" & ", topKeywords)
                : "Cluster non classificato";

        var descriptionParts = new List<string>();
        if (topGenres.Count > 0)
        {
            descriptionParts.Add($"generi ricorrenti: {string.Join(", ", topGenres)}");
        }

        if (topKeywords.Count > 0)
        {
            descriptionParts.Add($"temi ricorrenti: {string.Join(", ", topKeywords)}");
        }

        var description = descriptionParts.Count > 0
            ? $"{members.Count} film — {string.Join("; ", descriptionParts)}."
            : $"{members.Count} film raggruppati per similarità semantica.";

        return (label, description);
    }
}

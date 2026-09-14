namespace CineVector.Search.Clustering;

public class ClusteringOptions
{
    public const string SectionName = "Clustering";

    public int K { get; set; } = 12;
    public int MaxIterations { get; set; } = 100;

    /// <summary>Numero massimo di generi usati per comporre l'etichetta automatica di un cluster.</summary>
    public int LabelGenreCount { get; set; } = 2;

    /// <summary>Numero massimo di keyword usate per comporre l'etichetta automatica di un cluster.</summary>
    public int LabelKeywordCount { get; set; } = 1;
}

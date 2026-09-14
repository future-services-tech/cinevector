namespace MovieCatalog.Search;

/// <summary>Segnali di rilevanza per un singolo risultato. I segnali non disponibili (es. SemanticScore prima della Fase 4) sono null e vengono esclusi dalla combinazione pesata invece di penalizzare il punteggio.</summary>
public record RankingSignals(double? FullTextScore, double? SemanticScore, double? MetadataScore);

public interface ISearchRankingService
{
    /// <summary>Punteggio combinato, tipicamente nell'intervallo [0,1].</summary>
    double ComputeScore(RankingSignals signals);
}

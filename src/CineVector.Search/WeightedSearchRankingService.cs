using Microsoft.Extensions.Options;

namespace CineVector.Search;

/// <summary>Combina i segnali disponibili pesandoli secondo configurazione, rinormalizzando sui soli segnali presenti così che una query solo full-text o solo strutturata non venga penalizzata dal peso assegnato a un segnale semantico assente.</summary>
public class WeightedSearchRankingService(IOptions<SearchOptions> options) : ISearchRankingService
{
    public double ComputeScore(RankingSignals signals)
    {
        var weighted = 0d;
        var weightSum = 0d;
        var opts = options.Value;

        if (signals.FullTextScore is { } fullText)
        {
            weighted += fullText * opts.FullTextWeight;
            weightSum += opts.FullTextWeight;
        }

        if (signals.SemanticScore is { } semantic)
        {
            weighted += semantic * opts.SemanticWeight;
            weightSum += opts.SemanticWeight;
        }

        if (signals.MetadataScore is { } metadata)
        {
            weighted += metadata * opts.MetadataWeight;
            weightSum += opts.MetadataWeight;
        }

        return weightSum > 0 ? weighted / weightSum : 0;
    }
}

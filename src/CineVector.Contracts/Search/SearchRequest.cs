namespace CineVector.Contracts.Search;

/// <summary>Richiesta di ricerca. Supporta ricerca strutturata (solo filtri), full-text (Query valorizzato),
/// semantica (Semantic=true) e le combinazioni di queste, oltre all'interpretazione in linguaggio naturale
/// di Query quando NaturalLanguage=true (Fase 5).</summary>
public class SearchRequest
{
    public string? Query { get; set; }

    public IReadOnlyCollection<string> Genres { get; set; } = [];
    public IReadOnlyCollection<string> Actors { get; set; } = [];
    public IReadOnlyCollection<string> Directors { get; set; } = [];

    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public double? RatingFrom { get; set; }
    public double? RatingTo { get; set; }
    public string? Language { get; set; }
    public string? Country { get; set; }

    /// <summary>Se true, cerca per similarità semantica sull'embedding invece che (o oltre che) lessicalmente.
    /// Se la generazione dell'embedding per la query fallisce, si ripiega su full-text/strutturata.</summary>
    public bool Semantic { get; set; }

    /// <summary>Se true, Query è trattata come frase in linguaggio naturale: un parser rule-based ne estrae
    /// generi/anno/rating/attore/nazione, impostandoli sui campi sopra se non già valorizzati esplicitamente,
    /// e riduce Query al testo libero residuo (attivando anche Semantic).</summary>
    public bool NaturalLanguage { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    public SearchSort Sort { get; set; } = SearchSort.Relevance;
}

public enum SearchSort
{
    Relevance,
    YearDesc,
    YearAsc,
    RatingDesc,
    TitleAsc
}

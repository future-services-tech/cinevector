namespace CineVector.Search.NaturalLanguage;

/// <summary>Intento di ricerca estratto da una frase in linguaggio naturale. I candidati per genere includono
/// più varianti ortografiche/linguistiche dello stesso genere (es. "Fantascienza" e "Science Fiction") perché
/// fonti diverse popolano il campo in lingue diverse: il filtro strutturato le considera in OR.</summary>
public class SearchIntent
{
    public string? TextQuery { get; set; }
    public List<string> Genres { get; set; } = [];
    public List<string> Actors { get; set; } = [];
    public List<string> Directors { get; set; } = [];
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public double? RatingMin { get; set; }
    public string? Country { get; set; }

    /// <summary>True quando resta un residuo di testo libero non riconducibile a un filtro strutturato:
    /// in quel caso ha senso cercarlo per significato, non solo lessicalmente.</summary>
    public bool Semantic { get; set; }
}

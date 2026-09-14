namespace MovieCatalog.Infrastructure.Sources.Tmdb;

public class TmdbOptions
{
    public const string SectionName = "Tmdb";

    public required string BaseUrl { get; set; }
    public required string ImageBaseUrl { get; set; }
    public string ApiKeyEnvironmentVariable { get; set; } = "TMDB_API_KEY";
    public string Language { get; set; } = "it-IT";

    /// <summary>Numero di pagine di /discover/movie da scaricare per ogni esecuzione del crawler (20 film per pagina).
    /// Limita di proposito il volume per esecuzione invece di scaricare l'intero catalogo TMDb.</summary>
    public int DiscoverPages { get; set; } = 5;
}

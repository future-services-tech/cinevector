namespace CineVector.Infrastructure.Sources.Omdb;

public class OmdbOptions
{
    public const string SectionName = "Omdb";

    public required string BaseUrl { get; set; }
    public string ApiKeyEnvironmentVariable { get; set; } = "OMDB_API_KEY";

    /// <summary>Numero di pagine di risultati (10 per pagina) scaricate da /?s= per ogni ricerca per titolo.</summary>
    public int MaxSearchPages { get; set; } = 5;

    /// <summary>Valorizzata via PostConfigure in DependencyInjection.AddOmdbSource, non da appsettings: OMDb richiede
    /// la chiave come query string su ogni richiesta (non un header), quindi deve restare leggibile da OmdbApiClient.</summary>
    public string? ApiKey { get; set; }
}

namespace CineVector.Contracts.Movies;

/// <summary>Payload per la creazione/modifica manuale di un film da parte dell'amministratore (CRUD di base, Fase 1). L'inserimento tramite crawler userà una pipeline separata (Fase 3).</summary>
public class UpsertMovieRequest
{
    public required string SourceName { get; set; }
    public required string ExternalId { get; set; }
    public required string Title { get; set; }
    public string? OriginalTitle { get; set; }
    public int? Year { get; set; }
    public string? Overview { get; set; }
    public double? Rating { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public required string PlatformUrl { get; set; }
    public string? Language { get; set; }
    public string? Country { get; set; }
    public IReadOnlyCollection<string> Genres { get; set; } = [];
    public IReadOnlyCollection<string> Keywords { get; set; } = [];
    public IReadOnlyCollection<string> Directors { get; set; } = [];
    public IReadOnlyCollection<UpsertMovieCastMember> Cast { get; set; } = [];
    public IReadOnlyCollection<UpsertMovieCrewMember> Crew { get; set; } = [];
}

public class UpsertMovieCastMember
{
    public required string Name { get; set; }
    public string? Character { get; set; }
    public int BillingOrder { get; set; }
    /// <summary>Se valorizzata, aggiorna la foto profilo dell'attore — è un attributo della persona,
    /// condiviso tra tutti i suoi film, non del singolo ruolo in questo film.</summary>
    public string? ProfileUrl { get; set; }
}

public class UpsertMovieCrewMember
{
    public required string Name { get; set; }
    public required string Role { get; set; }
}

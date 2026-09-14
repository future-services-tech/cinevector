namespace MovieCatalog.Domain.Entities;

public class Person
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }
    public string? ProfileUrl { get; set; }
    public string? WikipediaUrl { get; set; }
    /// <summary>Quando è stato tentato l'arricchimento (foto/Wikipedia) l'ultima volta — indipendentemente dal
    /// risultato. Distingue "mai controllato" (null) da "controllato, nessuna pagina trovata" (valorizzato ma
    /// WikipediaUrl ancora null), evitando di ripetere la ricerca all'infinito per chi non ha una voce Wikipedia.</summary>
    public DateTimeOffset? InfoUpdatedAt { get; set; }

    public ICollection<MovieCast> CastRoles { get; set; } = [];
    public ICollection<MovieDirector> DirectedMovies { get; set; } = [];
    public ICollection<MovieCrew> CrewRoles { get; set; } = [];
}

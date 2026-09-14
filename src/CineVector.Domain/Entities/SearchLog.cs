namespace CineVector.Domain.Entities;

/// <summary>Registrazione anonima e aggregata di una ricerca eseguita (nessun identificativo utente/sessione),
/// usata per l'analisi d'uso del motore di ricerca nella dashboard admin.</summary>
public class SearchLog
{
    public int Id { get; set; }
    public string? Query { get; set; }
    public required string Mode { get; set; }
    public int ResultCount { get; set; }
    public double DurationMs { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

namespace CineVector.Domain.Entities;

/// <summary>Parola chiave tematica (es. "time-travel", "mafia", "second-chance") usata per collegare film tra loro oltre al genere.</summary>
public class Keyword
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }

    public ICollection<MovieKeyword> MovieKeywords { get; set; } = [];
}

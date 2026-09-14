using CineVector.Domain.Enums;

namespace CineVector.Application.Crawling;

public record MovieCastMemberMetadata(string Name, string? Character, int BillingOrder, string? ProfileUrl = null);

public record MovieCrewMemberMetadata(string Name, CrewRole Role, string? ProfileUrl = null);

/// <summary>Riferimento leggero a una persona (oggi usato per i registi): solo ciò che serve per risolvere/creare
/// il <see cref="CineVector.Domain.Entities.Person"/> e, se disponibile dalla fonte, la sua foto.</summary>
public record MoviePersonRef(string Name, string? ProfileUrl = null);

/// <summary>Metadati di un film già normalizzati da un <see cref="ISourceAdapter"/>, indipendenti dalla fonte di origine.</summary>
public class MovieMetadata
{
    public required string ExternalId { get; init; }
    public required string Title { get; init; }
    public string? OriginalTitle { get; init; }
    public int? Year { get; init; }
    public string? Overview { get; init; }
    public double? Rating { get; init; }
    public string? PosterUrl { get; init; }
    public string? BackdropUrl { get; init; }
    public required string PlatformUrl { get; init; }
    public string? Language { get; init; }
    public string? Country { get; init; }

    public IReadOnlyCollection<string> Genres { get; init; } = [];
    public IReadOnlyCollection<string> Keywords { get; init; } = [];
    public IReadOnlyCollection<MoviePersonRef> Directors { get; init; } = [];
    public IReadOnlyCollection<MovieCrewMemberMetadata> Crew { get; init; } = [];
    public IReadOnlyCollection<MovieCastMemberMetadata> Cast { get; init; } = [];
}

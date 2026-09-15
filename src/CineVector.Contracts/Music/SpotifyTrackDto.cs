namespace CineVector.Contracts.Music;

public class SpotifyTrackDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Artists { get; set; }
    public string? Album { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>Anteprima di 30s in MP3, riproducibile direttamente via &lt;audio&gt; — può essere null: Spotify
    /// non garantisce una preview per ogni brano (dipende da licenza/mercato).</summary>
    public string? PreviewUrl { get; set; }
    public required string SpotifyUrl { get; set; }
}

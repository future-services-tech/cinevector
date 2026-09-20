using System.Text.Json.Serialization;

namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Risposta di POST /api/token (Client Credentials Flow) — https://accounts.spotify.com/api/token.</summary>
public class SpotifyTokenResponse
{
    [JsonPropertyName("access_token")]
    public required string AccessToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    /// <summary>Presente sempre nello scambio del "code" iniziale; presente solo a volte nel refresh
    /// (Spotify a volte ruota il refresh token, a volte no) — per questo è nullable qui.</summary>
    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }
}

/// <summary>Forma (ridotta ai campi usati) della risposta di GET /v1/search?type=track.</summary>
public class SpotifySearchResponse
{
    public SpotifyTrackPage? Tracks { get; set; }
}

public class SpotifyTrackPage
{
    public List<SpotifyTrackItem> Items { get; set; } = [];
}

public class SpotifyTrackItem
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public List<SpotifyArtist> Artists { get; set; } = [];
    public SpotifyAlbum? Album { get; set; }

    [JsonPropertyName("preview_url")]
    public string? PreviewUrl { get; set; }

    [JsonPropertyName("external_urls")]
    public SpotifyExternalUrls? ExternalUrls { get; set; }
}

public class SpotifyArtist
{
    public required string Name { get; set; }
}

public class SpotifyAlbum
{
    public required string Name { get; set; }
    public List<SpotifyImage> Images { get; set; } = [];
}

public class SpotifyImage
{
    public required string Url { get; set; }
}

public class SpotifyExternalUrls
{
    public string? Spotify { get; set; }
}

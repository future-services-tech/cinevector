namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Un'app Spotify registrata (Client ID/Secret propri) che può fare da fallback per un'altra: se l'app
/// "primary" viene bloccata (rate limit, restrizioni account) la ricerca prova automaticamente la successiva.
/// Ogni profilo ha il proprio login one-time e il proprio refresh token (i token Spotify sono legati al
/// singolo Client ID, non sono condivisibili tra app diverse).</summary>
public class SpotifyAppProfile
{
    public required string Name { get; set; }
    public required string ClientIdEnvironmentVariable { get; set; }
    public required string ClientSecretEnvironmentVariable { get; set; }
}

public class SpotifyOptions
{
    public const string SectionName = "Spotify";

    public string AuthBaseUrl { get; set; } = "https://accounts.spotify.com/";
    public string ApiBaseUrl { get; set; } = "https://api.spotify.com/v1/";

    /// <summary>Deve corrispondere esattamente (Spotify fa match letterale) a un Redirect URI registrato su
    /// OGNI app Spotify coinvolta — stesso redirect_uri per tutte, cambia solo il Client ID/Secret usato.</summary>
    public string RedirectUri { get; set; } = "http://127.0.0.1:5174/callback";

    /// <summary>Nessuno scope richiesto: solo ricerca nel catalogo pubblico, mai libreria/playlist dell'utente.</summary>
    public string Scope { get; set; } = "";

    /// <summary>In ordine di tentativo: la prima è quella preferita, le successive sono fallback.</summary>
    public List<SpotifyAppProfile> Profiles { get; set; } =
    [
        new() { Name = "primary", ClientIdEnvironmentVariable = "SPOTIFY_CLIENT_ID", ClientSecretEnvironmentVariable = "SPOTIFY_CLIENT_SECRET" },
        new() { Name = "fallback", ClientIdEnvironmentVariable = "SPOTIFY_FB_CLIENT_ID", ClientSecretEnvironmentVariable = "SPOTIFY_FB_CLIENT_SECRET" },
    ];
}

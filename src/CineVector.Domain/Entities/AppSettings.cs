namespace CineVector.Domain.Entities;

/// <summary>Preferenze UI globali dell'istanza (riga singola, Id fisso = 1): non esiste ancora un sistema di
/// autenticazione/utenti, quindi non ha senso avere impostazioni per-utente — sono condivise da chiunque usi
/// il frontend, esattamente come oggi funzionavano via localStorage del browser.</summary>
public class AppSettings
{
    public int Id { get; set; } = 1;
    /// <summary>"chiaro" | "scuro" | "sistema" (segue la preferenza del sistema operativo).</summary>
    public string Theme { get; set; } = "scuro";
    public bool AnimationsEnabled { get; set; } = true;
    public bool CardHoverEffects { get; set; } = true;
    public bool CarouselEnabled { get; set; } = true;
    public int CarouselSpeedSec { get; set; } = 65;
    public string SphereDensity { get; set; } = "leggera";
    public string HaloIntensity { get; set; } = "sottile";
    public bool ClusterPanelDefaultOpen { get; set; }
    public bool NotificationsEnabled { get; set; } = true;
    public bool SpotifyAutoMatchEnabled { get; set; } = true;
    public int DefaultPlayerVolume { get; set; } = 80;
    public string PosterSphereZoom { get; set; } = "normale";
    public int PosterSpherePageSize { get; set; } = 30;
}

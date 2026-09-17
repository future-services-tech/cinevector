namespace CineVector.Contracts.Settings;

public class AppSettingsDto
{
    public required string Theme { get; set; }
    public bool AnimationsEnabled { get; set; }
    public bool CardHoverEffects { get; set; }
    public bool CarouselEnabled { get; set; }
    public int CarouselSpeedSec { get; set; }
    public required string SphereDensity { get; set; }
    public required string HaloIntensity { get; set; }
    public bool ClusterPanelDefaultOpen { get; set; }
    public bool NotificationsEnabled { get; set; }
    public bool SpotifyAutoMatchEnabled { get; set; }
    public int DefaultPlayerVolume { get; set; }
    public required string PosterSphereZoom { get; set; }
    public int PosterSpherePageSize { get; set; }
}

public class UpdateAppSettingsRequest
{
    public required string Theme { get; set; }
    public bool AnimationsEnabled { get; set; }
    public bool CardHoverEffects { get; set; }
    public bool CarouselEnabled { get; set; }
    public int CarouselSpeedSec { get; set; }
    public required string SphereDensity { get; set; }
    public required string HaloIntensity { get; set; }
    public bool ClusterPanelDefaultOpen { get; set; }
    public bool NotificationsEnabled { get; set; }
    public bool SpotifyAutoMatchEnabled { get; set; }
    public int DefaultPlayerVolume { get; set; }
    public required string PosterSphereZoom { get; set; }
    public int PosterSpherePageSize { get; set; }
}

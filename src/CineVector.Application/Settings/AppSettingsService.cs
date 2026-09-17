using CineVector.Contracts.Settings;
using CineVector.Domain.Entities;

namespace CineVector.Application.Settings;

public class AppSettingsService(IAppSettingsRepository repository)
{
    public async Task<AppSettingsDto> GetAsync(CancellationToken ct)
    {
        var settings = await repository.GetAsync(ct);
        return ToDto(settings);
    }

    public async Task<AppSettingsDto> UpdateAsync(UpdateAppSettingsRequest request, CancellationToken ct)
    {
        var settings = await repository.GetAsync(ct);

        settings.Theme = request.Theme;
        settings.AnimationsEnabled = request.AnimationsEnabled;
        settings.CardHoverEffects = request.CardHoverEffects;
        settings.CarouselEnabled = request.CarouselEnabled;
        settings.CarouselSpeedSec = request.CarouselSpeedSec;
        settings.SphereDensity = request.SphereDensity;
        settings.HaloIntensity = request.HaloIntensity;
        settings.ClusterPanelDefaultOpen = request.ClusterPanelDefaultOpen;
        settings.NotificationsEnabled = request.NotificationsEnabled;
        settings.SpotifyAutoMatchEnabled = request.SpotifyAutoMatchEnabled;
        settings.DefaultPlayerVolume = request.DefaultPlayerVolume;
        settings.PosterSphereZoom = request.PosterSphereZoom;
        settings.PosterSpherePageSize = request.PosterSpherePageSize;

        await repository.SaveChangesAsync(ct);
        return ToDto(settings);
    }

    private static AppSettingsDto ToDto(AppSettings s) => new()
    {
        Theme = s.Theme,
        AnimationsEnabled = s.AnimationsEnabled,
        CardHoverEffects = s.CardHoverEffects,
        CarouselEnabled = s.CarouselEnabled,
        CarouselSpeedSec = s.CarouselSpeedSec,
        SphereDensity = s.SphereDensity,
        HaloIntensity = s.HaloIntensity,
        ClusterPanelDefaultOpen = s.ClusterPanelDefaultOpen,
        NotificationsEnabled = s.NotificationsEnabled,
        SpotifyAutoMatchEnabled = s.SpotifyAutoMatchEnabled,
        DefaultPlayerVolume = s.DefaultPlayerVolume,
        PosterSphereZoom = s.PosterSphereZoom,
        PosterSpherePageSize = s.PosterSpherePageSize,
    };
}

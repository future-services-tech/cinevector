using FluentValidation;
using CineVector.Contracts.Settings;

namespace CineVector.Application.Settings;

public class UpdateAppSettingsRequestValidator : AbstractValidator<UpdateAppSettingsRequest>
{
    private static readonly string[] ThemeValues = ["chiaro", "scuro", "sistema"];
    private static readonly string[] SphereDensityValues = ["leggera", "media", "piena"];
    private static readonly string[] HaloIntensityValues = ["sottile", "normale", "intenso"];
    private static readonly string[] PosterSphereZoomValues = ["compatta", "normale", "grande"];

    public UpdateAppSettingsRequestValidator()
    {
        RuleFor(s => s.Theme).Must(v => ThemeValues.Contains(v))
            .WithMessage($"Theme deve essere uno tra: {string.Join(", ", ThemeValues)}.");
        RuleFor(s => s.SphereDensity).Must(v => SphereDensityValues.Contains(v))
            .WithMessage($"SphereDensity deve essere uno tra: {string.Join(", ", SphereDensityValues)}.");
        RuleFor(s => s.HaloIntensity).Must(v => HaloIntensityValues.Contains(v))
            .WithMessage($"HaloIntensity deve essere uno tra: {string.Join(", ", HaloIntensityValues)}.");
        RuleFor(s => s.PosterSphereZoom).Must(v => PosterSphereZoomValues.Contains(v))
            .WithMessage($"PosterSphereZoom deve essere uno tra: {string.Join(", ", PosterSphereZoomValues)}.");
        RuleFor(s => s.CarouselSpeedSec).InclusiveBetween(5, 600);
        RuleFor(s => s.DefaultPlayerVolume).InclusiveBetween(0, 100);
        RuleFor(s => s.PosterSpherePageSize).InclusiveBetween(1, 200);
    }
}

using FluentValidation;
using CineVector.Contracts.Movies;

namespace CineVector.Application.Movies;

public class UpsertMovieRequestValidator : AbstractValidator<UpsertMovieRequest>
{
    public UpsertMovieRequestValidator()
    {
        RuleFor(m => m.SourceName).NotEmpty().MaximumLength(150);
        RuleFor(m => m.ExternalId).NotEmpty().MaximumLength(200);
        RuleFor(m => m.Title).NotEmpty().MaximumLength(500);
        RuleFor(m => m.PlatformUrl).NotEmpty().MaximumLength(2000).Must(BeAWellFormedUrl)
            .WithMessage("PlatformUrl deve essere un URL assoluto valido (http/https).");
        RuleFor(m => m.Year).InclusiveBetween(1870, DateTime.UtcNow.Year + 5).When(m => m.Year.HasValue);
        RuleFor(m => m.Rating).InclusiveBetween(0, 10).When(m => m.Rating.HasValue);
    }

    private static bool BeAWellFormedUrl(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}

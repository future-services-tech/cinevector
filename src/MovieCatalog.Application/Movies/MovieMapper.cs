using MovieCatalog.Contracts.Movies;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Application.Movies;

public static class MovieMapper
{
    public static MovieDto ToDto(Movie movie) => new()
    {
        Id = movie.Id,
        SourceName = movie.Source?.Name ?? string.Empty,
        Title = movie.Title,
        OriginalTitle = movie.OriginalTitle,
        Year = movie.Year,
        Overview = movie.Overview,
        Rating = movie.Rating,
        PosterUrl = movie.PosterUrl,
        BackdropUrl = movie.BackdropUrl,
        PlatformUrl = movie.PlatformUrl,
        Language = movie.Language,
        Country = movie.Country,
        ClusterId = movie.ClusterId,
        ClusterLabel = movie.Cluster?.Label,
        Genres = movie.Genres.Select(g => g.Genre!.Name).ToList(),
        Keywords = movie.Keywords.Select(k => k.Keyword!.Name).ToList(),
        Directors = movie.Directors
            .Select(d => new MoviePersonDto
            {
                Name = d.Person!.Name,
                ProfileUrl = d.Person.ProfileUrl,
                WikipediaUrl = d.Person.WikipediaUrl
            })
            .ToList(),
        Cast = movie.Cast
            .OrderBy(c => c.BillingOrder)
            .Select(c => new MovieCastMemberDto
            {
                Name = c.Person!.Name,
                Character = c.Character,
                BillingOrder = c.BillingOrder,
                ProfileUrl = c.Person.ProfileUrl,
                WikipediaUrl = c.Person.WikipediaUrl
            })
            .ToList(),
        Crew = movie.Crew
            .Select(c => new MovieCrewMemberDto
            {
                Name = c.Person!.Name,
                Role = c.Role.ToString(),
                ProfileUrl = c.Person.ProfileUrl,
                WikipediaUrl = c.Person.WikipediaUrl
            })
            .ToList(),
        CreatedAt = movie.CreatedAt,
        UpdatedAt = movie.UpdatedAt
    };

    public static MovieSummaryDto ToSummaryDto(Movie movie) => new()
    {
        Id = movie.Id,
        Title = movie.Title,
        OriginalTitle = movie.OriginalTitle,
        Year = movie.Year,
        Rating = movie.Rating,
        PosterUrl = movie.PosterUrl,
        Genres = movie.Genres.Select(g => g.Genre!.Name).ToList()
    };
}

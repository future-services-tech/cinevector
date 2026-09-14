using MovieCatalog.Domain.Enums;

namespace MovieCatalog.Domain.Entities;

public class MovieCrew
{
    public int MovieId { get; set; }
    public Movie? Movie { get; set; }

    public int PersonId { get; set; }
    public Person? Person { get; set; }

    public CrewRole Role { get; set; }
}

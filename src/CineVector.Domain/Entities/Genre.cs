namespace CineVector.Domain.Entities;

public class Genre
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string NormalizedName { get; set; }

    public ICollection<MovieGenre> MovieGenres { get; set; } = [];
}

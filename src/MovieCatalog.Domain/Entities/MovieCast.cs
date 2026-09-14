namespace MovieCatalog.Domain.Entities;

public class MovieCast
{
    public int MovieId { get; set; }
    public Movie? Movie { get; set; }

    public int PersonId { get; set; }
    public Person? Person { get; set; }

    public string? Character { get; set; }
    public int BillingOrder { get; set; }
}

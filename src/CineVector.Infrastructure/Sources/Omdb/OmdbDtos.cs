using System.Text.Json.Serialization;

namespace CineVector.Infrastructure.Sources.Omdb;

public class OmdbSearchResponse
{
    [JsonPropertyName("Search")]
    public List<OmdbSearchResult> Search { get; set; } = [];

    [JsonPropertyName("totalResults")]
    public string? TotalResults { get; set; }

    [JsonPropertyName("Response")]
    public string Response { get; set; } = "False";
}

public class OmdbSearchResult
{
    [JsonPropertyName("Title")]
    public string? Title { get; set; }

    [JsonPropertyName("Year")]
    public string? Year { get; set; }

    [JsonPropertyName("imdbID")]
    public required string ImdbId { get; set; }

    [JsonPropertyName("Type")]
    public string? Type { get; set; }

    [JsonPropertyName("Poster")]
    public string? Poster { get; set; }
}

public class OmdbMovieDetail
{
    [JsonPropertyName("Title")]
    public string? Title { get; set; }

    [JsonPropertyName("Year")]
    public string? Year { get; set; }

    [JsonPropertyName("Genre")]
    public string? Genre { get; set; }

    [JsonPropertyName("Director")]
    public string? Director { get; set; }

    [JsonPropertyName("Writer")]
    public string? Writer { get; set; }

    [JsonPropertyName("Actors")]
    public string? Actors { get; set; }

    [JsonPropertyName("Plot")]
    public string? Plot { get; set; }

    [JsonPropertyName("Language")]
    public string? Language { get; set; }

    [JsonPropertyName("Country")]
    public string? Country { get; set; }

    [JsonPropertyName("Poster")]
    public string? Poster { get; set; }

    [JsonPropertyName("imdbRating")]
    public string? ImdbRating { get; set; }

    [JsonPropertyName("imdbID")]
    public string? ImdbId { get; set; }

    [JsonPropertyName("Response")]
    public string Response { get; set; } = "False";

    [JsonPropertyName("Error")]
    public string? Error { get; set; }
}

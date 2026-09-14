namespace MovieCatalog.Infrastructure.Embeddings;

public class EmbeddingOptions
{
    public const string SectionName = "Embedding";

    public string Provider { get; set; } = "OmniRouter";
    public required string BaseUrl { get; set; }
    public required string Model { get; set; }
    public int Dimensions { get; set; } = 384;
    public string ApiKeyEnvironmentVariable { get; set; } = "OMNIROUTER_API_KEY";
}

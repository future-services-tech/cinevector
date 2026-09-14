namespace MovieCatalog.Application.Crawling;

public interface IUrlCanonicalizer
{
    /// <summary>Normalizza un URL di pagina film (schema/host in minuscolo, senza slash finale/query/fragment) e rifiuta
    /// schemi diversi da http/https o pattern che indicano una risorsa video/stream (.m3u8, .mp4, blob:, player:, stream:, download:).
    /// Restituisce null se l'URL non è ammesso.</summary>
    string? Canonicalize(string url);
}

using MovieCatalog.Application.Crawling;

namespace MovieCatalog.Infrastructure.Crawling;

public class UrlCanonicalizer : IUrlCanonicalizer
{
    private static readonly string[] BlockedSchemes = ["blob", "player", "stream", "download"];
    private static readonly string[] BlockedExtensions = [".m3u8", ".mp4", ".mkv", ".avi", ".mov", ".ts"];

    public string? Canonicalize(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        var scheme = ExtractScheme(url);
        if (scheme is not null && BlockedSchemes.Contains(scheme, StringComparer.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            return null;
        }

        if (BlockedExtensions.Any(ext => uri.AbsolutePath.EndsWith(ext, StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }

        var builder = new UriBuilder(uri)
        {
            Scheme = uri.Scheme.ToLowerInvariant(),
            Host = uri.Host.ToLowerInvariant(),
            Query = string.Empty,
            Fragment = string.Empty
        };

        var path = builder.Path;
        if (path.Length > 1 && path.EndsWith('/'))
        {
            builder.Path = path.TrimEnd('/');
        }

        // Rimuove la porta di default per rendere confrontabili URL equivalenti (es. :443 su https).
        if ((builder.Scheme == Uri.UriSchemeHttp && builder.Port == 80) ||
            (builder.Scheme == Uri.UriSchemeHttps && builder.Port == 443))
        {
            builder.Port = -1;
        }

        return builder.Uri.ToString();
    }

    private static string? ExtractScheme(string url)
    {
        var separatorIndex = url.IndexOf(':');
        return separatorIndex > 0 ? url[..separatorIndex] : null;
    }
}

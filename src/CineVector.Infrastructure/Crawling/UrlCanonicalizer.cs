using System.Net;
using CineVector.Application.Crawling;

namespace CineVector.Infrastructure.Crawling;

public class UrlCanonicalizer : IUrlCanonicalizer
{
    private static readonly string[] BlockedSchemes = ["blob", "player", "stream", "download"];
    private static readonly string[] BlockedExtensions = [".m3u8", ".mp4", ".mkv", ".avi", ".mov", ".ts"];

    // Guard SSRF: blocca i range IPv4 non instradabili pubblicamente (loopback, privati, link-local — incluso
    // 169.254.169.254, l'endpoint dei metadati cloud su AWS/GCP/Azure). Copre solo IP letterali nell'URL: un
    // hostname simbolico che risolve via DNS a uno di questi indirizzi (DNS rebinding) non è intercettato qui,
    // perché richiederebbe una risoluzione DNS a ogni canonicalizzazione — accettabile oggi perché l'unico
    // adapter reale (TMDb) non usa mai Source.BaseUrl per le richieste in uscita (vedi TmdbApiClient); da
    // rivedere se in futuro un adapter dovesse effettuare richieste HTTP dirette verso URL scoperti dal crawl.
    private static readonly (IPAddress Network, int PrefixLength)[] BlockedIPv4Ranges =
    [
        (IPAddress.Parse("0.0.0.0"), 8),
        (IPAddress.Parse("10.0.0.0"), 8),
        (IPAddress.Parse("100.64.0.0"), 10),
        (IPAddress.Parse("127.0.0.0"), 8),
        (IPAddress.Parse("169.254.0.0"), 16),
        (IPAddress.Parse("172.16.0.0"), 12),
        (IPAddress.Parse("192.0.0.0"), 24),
        (IPAddress.Parse("192.168.0.0"), 16),
        (IPAddress.Parse("198.18.0.0"), 15),
        (IPAddress.Parse("224.0.0.0"), 4),
    ];

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

        if (IsBlockedHost(uri.Host))
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

    private static bool IsBlockedHost(string host)
    {
        if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!IPAddress.TryParse(host, out var ip))
        {
            return false;
        }

        if (IPAddress.IsLoopback(ip) || ip.Equals(IPAddress.IPv6Loopback))
        {
            return true;
        }

        if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || ip.IsIPv6UniqueLocal || ip.IsIPv6Multicast)
        {
            return true;
        }

        if (ip.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
        {
            return false;
        }

        var ipBytes = ip.GetAddressBytes();
        foreach (var (network, prefixLength) in BlockedIPv4Ranges)
        {
            if (MatchesPrefix(ipBytes, network.GetAddressBytes(), prefixLength))
            {
                return true;
            }
        }

        return false;
    }

    private static bool MatchesPrefix(byte[] address, byte[] network, int prefixLength)
    {
        var fullBytes = prefixLength / 8;
        var remainingBits = prefixLength % 8;

        for (var i = 0; i < fullBytes; i++)
        {
            if (address[i] != network[i])
            {
                return false;
            }
        }

        if (remainingBits == 0)
        {
            return true;
        }

        var mask = (byte)~(0xFF >> remainingBits);
        return (address[fullBytes] & mask) == (network[fullBytes] & mask);
    }
}

using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using CineVector.Application.Music;

namespace CineVector.Infrastructure.Music.ITunes;

public class ITunesLookupService(HttpClient httpClient, ILogger<ITunesLookupService> logger) : IITunesLookupService
{
    public async Task<string?> FindPreviewUrlAsync(string artist, string title, CancellationToken ct)
    {
        try
        {
            var term = Uri.EscapeDataString($"{artist} {title}");
            var response = await httpClient.GetAsync($"search?term={term}&media=music&entity=song&limit=1", ct);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var payload = await response.Content.ReadFromJsonAsync<ITunesSearchResponse>(cancellationToken: ct);
            return payload?.Results?.FirstOrDefault()?.PreviewUrl;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Ricerca anteprima iTunes fallita per '{Artist} - {Title}'", artist, title);
            return null;
        }
    }

    private class ITunesSearchResponse
    {
        [JsonPropertyName("results")]
        public List<ITunesTrack>? Results { get; set; }
    }

    private class ITunesTrack
    {
        [JsonPropertyName("previewUrl")]
        public string? PreviewUrl { get; set; }
    }
}

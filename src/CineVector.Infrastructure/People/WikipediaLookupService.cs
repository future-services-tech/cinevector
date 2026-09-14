using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using CineVector.Application.People;

namespace CineVector.Infrastructure.People;

/// <summary>Usa l'API pubblica "opensearch" di Wikipedia (nessuna autenticazione richiesta) per trovare la pagina
/// più pertinente per un nome. Risposta nel formato eterogeneo di opensearch: [query, [titoli], [descrizioni], [url]].
/// Qualunque errore (persona non trovata, rete, timeout) restituisce null senza propagare l'eccezione: è un
/// arricchimento opzionale e non deve mai far fallire la creazione di una persona o di un film.</summary>
public class WikipediaLookupService(HttpClient httpClient, ILogger<WikipediaLookupService> logger) : IWikipediaLookupService
{
    public async Task<string?> FindArticleUrlAsync(string personName, CancellationToken ct)
    {
        try
        {
            var response = await httpClient.GetAsync(
                $"w/api.php?action=opensearch&format=json&limit=1&namespace=0&search={Uri.EscapeDataString(personName)}", ct);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var payload = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            if (payload.ValueKind != JsonValueKind.Array || payload.GetArrayLength() < 4)
            {
                return null;
            }

            var urls = payload[3];
            return urls.ValueKind == JsonValueKind.Array && urls.GetArrayLength() > 0
                ? urls[0].GetString()
                : null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Ricerca Wikipedia fallita per '{Name}'", personName);
            return null;
        }
    }
}

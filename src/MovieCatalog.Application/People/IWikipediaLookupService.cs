namespace MovieCatalog.Application.People;

/// <summary>Cerca la pagina Wikipedia (inglese) più pertinente per un nome e cognome di persona, usando l'API di
/// ricerca ufficiale — non genera mai un URL a partire dal solo nome, evitando link a pagine inesistenti.
/// Un fallimento (persona non trovata, servizio non raggiungibile) restituisce null e non deve mai interrompere
/// la creazione del film/persona: è un arricchimento opzionale.</summary>
public interface IWikipediaLookupService
{
    Task<string?> FindArticleUrlAsync(string personName, CancellationToken ct);
}

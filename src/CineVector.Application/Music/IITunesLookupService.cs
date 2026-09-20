namespace CineVector.Application.Music;

/// <summary>Anteprime audio reali da 30s via l'API pubblica di ricerca iTunes (nessuna autenticazione richiesta),
/// usate come fallback per Spotify: dal 27 novembre 2024 Spotify riserva "preview_url" alle app approvate in
/// Extended Quota Mode, quindi per un'app come questa torna sempre null.</summary>
public interface IITunesLookupService
{
    /// <summary>Cerca un'anteprima per artista+titolo. Ritorna null se non trova un match, senza mai propagare
    /// eccezioni: è un arricchimento opzionale, non deve far fallire una ricerca.</summary>
    Task<string?> FindPreviewUrlAsync(string artist, string title, CancellationToken ct);
}

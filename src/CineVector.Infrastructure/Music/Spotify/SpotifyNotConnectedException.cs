namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Nessun account Spotify collegato per il profilo indicato (nessun refresh token salvato) — stato
/// atteso finché l'amministratore non completa il login one-time su /api/spotify/login, non un errore di sistema.</summary>
public class SpotifyNotConnectedException(string? profile = null)
    : Exception(profile is null ? "Nessun account Spotify collegato." : $"Nessun account Spotify collegato per il profilo '{profile}'.");

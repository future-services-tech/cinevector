using StackExchange.Redis;

namespace CineVector.Infrastructure.Music.Spotify;

/// <summary>Un account Spotify collegato per profilo/app configurata (non per-utente: CineVector non ha un
/// proprio sistema di login) — refresh token su Redis, non in memoria, così sopravvive a un riavvio dell'Api
/// e resta coerente anche con più istanze in esecuzione.</summary>
public class SpotifyAccountStore(IConnectionMultiplexer redis)
{
    private static readonly TimeSpan PendingStateTtl = TimeSpan.FromMinutes(10);

    private IDatabase Db => redis.GetDatabase();

    private static RedisKey RefreshTokenKey(string profile) => $"spotify:refresh_token:{profile}";
    private static RedisKey PendingStateKey(string profile) => $"spotify:pending_state:{profile}";

    public async Task<string?> GetRefreshTokenAsync(string profile)
    {
        var value = await Db.StringGetAsync(RefreshTokenKey(profile));
        return value.IsNullOrEmpty ? null : value.ToString();
    }

    public Task SetRefreshTokenAsync(string profile, string refreshToken) =>
        Db.StringSetAsync(RefreshTokenKey(profile), refreshToken);

    public Task ClearAsync(string profile) => Db.KeyDeleteAsync(RefreshTokenKey(profile));

    /// <summary>Protezione CSRF minimale per il login one-time: un solo valore "state" in sospeso alla volta
    /// per profilo (nessuna concorrenza attesa, è un flusso avviato manualmente da un unico amministratore).</summary>
    public Task SetPendingStateAsync(string profile, string state) =>
        Db.StringSetAsync(PendingStateKey(profile), state, PendingStateTtl);

    public async Task<bool> ConsumePendingStateAsync(string profile, string state)
    {
        var stored = await Db.StringGetAsync(PendingStateKey(profile));
        await Db.KeyDeleteAsync(PendingStateKey(profile));
        return !stored.IsNullOrEmpty && stored == state;
    }
}

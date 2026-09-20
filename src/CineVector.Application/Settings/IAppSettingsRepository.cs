using CineVector.Domain.Entities;

namespace CineVector.Application.Settings;

public interface IAppSettingsRepository
{
    /// <summary>Restituisce sempre la riga singola (Id = 1), creandola con i valori di default se manca — utile
    /// in ambienti dove la migrazione di seed non è ancora stata applicata.</summary>
    Task<AppSettings> GetAsync(CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}

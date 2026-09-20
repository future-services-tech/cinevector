using Microsoft.EntityFrameworkCore;
using CineVector.Application.Settings;
using CineVector.Domain.Entities;
using CineVector.Infrastructure.Persistence;

namespace CineVector.Infrastructure.Settings;

public class SettingsRepository(AppDbContext db) : IAppSettingsRepository
{
    public async Task<AppSettings> GetAsync(CancellationToken ct)
    {
        var settings = await db.Settings.FirstOrDefaultAsync(s => s.Id == 1, ct);
        if (settings is not null)
        {
            return settings;
        }

        // La riga viene seedata dalla migrazione (HasData): questo fallback serve solo per ambienti dove la
        // migrazione non è ancora stata applicata (es. database ricreato a mano).
        settings = new AppSettings { Id = 1 };
        db.Settings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}

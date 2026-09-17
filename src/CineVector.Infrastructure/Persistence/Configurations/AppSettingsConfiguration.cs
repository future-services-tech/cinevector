using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class AppSettingsConfiguration : IEntityTypeConfiguration<AppSettings>
{
    public void Configure(EntityTypeBuilder<AppSettings> builder)
    {
        builder.ToTable("app_settings");
        builder.Property(s => s.Theme).HasMaxLength(20).IsRequired();
        builder.Property(s => s.SphereDensity).HasMaxLength(20).IsRequired();
        builder.Property(s => s.HaloIntensity).HasMaxLength(20).IsRequired();
        builder.Property(s => s.PosterSphereZoom).HasMaxLength(20).IsRequired();

        // Seed della riga singola con i valori di default: il servizio non deve preoccuparsi di crearla al
        // primo avvio, esiste già dopo la migrazione.
        builder.HasData(new AppSettings { Id = 1 });
    }
}

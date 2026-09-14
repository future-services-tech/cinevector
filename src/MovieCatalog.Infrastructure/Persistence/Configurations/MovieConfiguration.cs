using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class MovieConfiguration : IEntityTypeConfiguration<Movie>
{
    public void Configure(EntityTypeBuilder<Movie> builder)
    {
        builder.ToTable("movies");

        builder.Property(m => m.ExternalId).HasMaxLength(200).IsRequired();
        builder.Property(m => m.Title).HasMaxLength(500).IsRequired();
        builder.Property(m => m.NormalizedTitle).HasMaxLength(500).IsRequired();
        builder.Property(m => m.OriginalTitle).HasMaxLength(500);
        builder.Property(m => m.PlatformUrl).HasMaxLength(2000).IsRequired();
        builder.Property(m => m.Language).HasMaxLength(50);
        builder.Property(m => m.Country).HasMaxLength(100);
        builder.Property(m => m.MetadataHash).HasMaxLength(64);

        builder.HasOne(m => m.Source)
            .WithMany(s => s.Movies)
            .HasForeignKey(m => m.SourceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => new { m.SourceId, m.ExternalId }).IsUnique();
        builder.HasIndex(m => m.Title);
        builder.HasIndex(m => new { m.NormalizedTitle, m.Year });
        builder.HasIndex(m => m.Year);
        builder.HasIndex(m => m.Rating);
        builder.HasIndex(m => m.LastSeenAt);
    }
}

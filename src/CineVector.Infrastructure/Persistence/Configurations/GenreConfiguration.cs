using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("genres");

        builder.Property(g => g.Name).HasMaxLength(150).IsRequired();
        builder.Property(g => g.NormalizedName).HasMaxLength(150).IsRequired();

        builder.HasIndex(g => g.NormalizedName).IsUnique();
    }
}

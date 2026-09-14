using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class KeywordConfiguration : IEntityTypeConfiguration<Keyword>
{
    public void Configure(EntityTypeBuilder<Keyword> builder)
    {
        builder.ToTable("keywords");

        builder.Property(k => k.Name).HasMaxLength(150).IsRequired();
        builder.Property(k => k.NormalizedName).HasMaxLength(150).IsRequired();

        builder.HasIndex(k => k.NormalizedName).IsUnique();
    }
}

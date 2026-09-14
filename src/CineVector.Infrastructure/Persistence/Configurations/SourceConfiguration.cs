using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class SourceConfiguration : IEntityTypeConfiguration<Source>
{
    public void Configure(EntityTypeBuilder<Source> builder)
    {
        builder.ToTable("sources");

        builder.Property(s => s.Name).HasMaxLength(150).IsRequired();
        builder.Property(s => s.BaseUrl).HasMaxLength(2000).IsRequired();
        builder.Property(s => s.AdapterType).HasMaxLength(150).IsRequired();

        builder.HasIndex(s => s.Name).IsUnique();
    }
}

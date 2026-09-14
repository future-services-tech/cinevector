using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.ToTable("people");

        builder.Property(p => p.Name).HasMaxLength(300).IsRequired();
        builder.Property(p => p.NormalizedName).HasMaxLength(300).IsRequired();
        builder.Property(p => p.ProfileUrl).HasMaxLength(500);
        builder.Property(p => p.WikipediaUrl).HasMaxLength(500);

        builder.HasIndex(p => p.NormalizedName);
    }
}

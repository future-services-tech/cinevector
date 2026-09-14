using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class SearchLogConfiguration : IEntityTypeConfiguration<SearchLog>
{
    public void Configure(EntityTypeBuilder<SearchLog> builder)
    {
        builder.ToTable("search_logs");

        builder.Property(l => l.Query).HasMaxLength(500);
        builder.Property(l => l.Mode).HasMaxLength(50).IsRequired();

        builder.HasIndex(l => l.CreatedAt);
    }
}

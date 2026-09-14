using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class MovieClusterConfiguration : IEntityTypeConfiguration<MovieCluster>
{
    public void Configure(EntityTypeBuilder<MovieCluster> builder)
    {
        builder.ToTable("movie_clusters");

        builder.Property(c => c.Label).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(1000).IsRequired();
    }
}

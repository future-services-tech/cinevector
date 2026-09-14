using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class CrawlJobConfiguration : IEntityTypeConfiguration<CrawlJob>
{
    public void Configure(EntityTypeBuilder<CrawlJob> builder)
    {
        builder.ToTable("crawl_jobs");

        builder.HasOne(j => j.Source)
            .WithMany(s => s.CrawlJobs)
            .HasForeignKey(j => j.SourceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(j => j.Query).HasMaxLength(300);

        builder.HasIndex(j => j.Status);
        builder.HasIndex(j => j.StartedAt);
    }
}

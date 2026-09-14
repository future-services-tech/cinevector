using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class CrawlErrorConfiguration : IEntityTypeConfiguration<CrawlError>
{
    public void Configure(EntityTypeBuilder<CrawlError> builder)
    {
        builder.ToTable("crawl_errors");

        builder.Property(e => e.Url).HasMaxLength(2000).IsRequired();
        builder.Property(e => e.ErrorType).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Message).HasMaxLength(4000).IsRequired();

        builder.HasOne(e => e.CrawlJob)
            .WithMany(j => j.Errors)
            .HasForeignKey(e => e.CrawlJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

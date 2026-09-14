using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MovieCatalog.Domain.Entities;

namespace MovieCatalog.Infrastructure.Persistence.Configurations;

public class MovieKeywordConfiguration : IEntityTypeConfiguration<MovieKeyword>
{
    public void Configure(EntityTypeBuilder<MovieKeyword> builder)
    {
        builder.ToTable("movie_keywords");

        builder.HasKey(mk => new { mk.MovieId, mk.KeywordId });

        builder.HasOne(mk => mk.Movie)
            .WithMany(m => m.Keywords)
            .HasForeignKey(mk => mk.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(mk => mk.Keyword)
            .WithMany(k => k.MovieKeywords)
            .HasForeignKey(mk => mk.KeywordId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

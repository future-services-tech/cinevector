using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class MovieDirectorConfiguration : IEntityTypeConfiguration<MovieDirector>
{
    public void Configure(EntityTypeBuilder<MovieDirector> builder)
    {
        builder.ToTable("movie_directors");

        builder.HasKey(md => new { md.MovieId, md.PersonId });

        builder.HasOne(md => md.Movie)
            .WithMany(m => m.Directors)
            .HasForeignKey(md => md.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(md => md.Person)
            .WithMany(p => p.DirectedMovies)
            .HasForeignKey(md => md.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

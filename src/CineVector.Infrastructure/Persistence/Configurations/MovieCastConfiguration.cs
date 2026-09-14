using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class MovieCastConfiguration : IEntityTypeConfiguration<MovieCast>
{
    public void Configure(EntityTypeBuilder<MovieCast> builder)
    {
        builder.ToTable("movie_cast");

        builder.HasKey(mc => new { mc.MovieId, mc.PersonId });

        builder.Property(mc => mc.Character).HasMaxLength(300);

        builder.HasOne(mc => mc.Movie)
            .WithMany(m => m.Cast)
            .HasForeignKey(mc => mc.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(mc => mc.Person)
            .WithMany(p => p.CastRoles)
            .HasForeignKey(mc => mc.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

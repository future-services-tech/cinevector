using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CineVector.Domain.Entities;

namespace CineVector.Infrastructure.Persistence.Configurations;

public class MovieCrewConfiguration : IEntityTypeConfiguration<MovieCrew>
{
    public void Configure(EntityTypeBuilder<MovieCrew> builder)
    {
        builder.ToTable("movie_crew");

        builder.HasKey(mc => new { mc.MovieId, mc.PersonId, mc.Role });

        builder.Property(mc => mc.Role).HasConversion<string>().HasMaxLength(50);

        builder.HasOne(mc => mc.Movie)
            .WithMany(m => m.Crew)
            .HasForeignKey(mc => mc.MovieId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(mc => mc.Person)
            .WithMany(p => p.CrewRoles)
            .HasForeignKey(mc => mc.PersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.Extensions.Configuration;
using MovieCatalog.Domain.Entities;
using NpgsqlTypes;
using Pgvector;

namespace MovieCatalog.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration) : DbContext(options)
{
    /// <summary>Nome della shadow property/colonna tsvector mantenuta da trigger PostgreSQL (titolo, trama, generi, cast, registi).</summary>
    public const string SearchVectorProperty = "SearchVector";

    /// <summary>Dimensione del vettore di embedding, definita a livello di schema. Cambiarla richiede una nuova migration.</summary>
    public int EmbeddingDimensions { get; } = configuration.GetValue("Embedding:Dimensions", 384);

    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Person> People => Set<Person>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Keyword> Keywords => Set<Keyword>();
    public DbSet<Source> Sources => Set<Source>();
    public DbSet<CrawlJob> CrawlJobs => Set<CrawlJob>();
    public DbSet<CrawlError> CrawlErrors => Set<CrawlError>();
    public DbSet<MovieCluster> MovieClusters => Set<MovieCluster>();
    public DbSet<SearchLog> SearchLogs => Set<SearchLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.HasPostgresExtension("unaccent");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<Movie>()
            .Property<NpgsqlTsVector>(SearchVectorProperty)
            .HasColumnName("search_vector");

        modelBuilder.Entity<Movie>()
            .HasIndex(SearchVectorProperty)
            .HasMethod("GIN")
            .HasDatabaseName("ix_movies_search_vector");

        ConfigureNullableVectorProperty(modelBuilder.Entity<Movie>().Property(m => m.Embedding));

        // HNSW con vector_cosine_ops: la ricerca semantica usa la distanza coseno (operatore <=>).
        // Adatto al volume atteso (Sezione 37): costruzione più lenta di IVFFlat ma query più precise senza fase di training.
        modelBuilder.Entity<Movie>()
            .HasIndex(m => m.Embedding)
            .HasMethod("hnsw")
            .HasOperators("vector_cosine_ops")
            .HasDatabaseName("ix_movies_embedding_hnsw");

        modelBuilder.Entity<Movie>()
            .HasOne(m => m.Cluster)
            .WithMany(c => c.Movies)
            .HasForeignKey(m => m.ClusterId)
            .OnDelete(DeleteBehavior.SetNull);

        ConfigureRequiredVectorProperty(modelBuilder.Entity<MovieCluster>().Property(c => c.Centroid));
    }

    private void ConfigureNullableVectorProperty(PropertyBuilder<float[]?> property)
    {
        property.HasConversion(
            v => v == null ? null : new Vector(v),
            v => v == null ? null : v.ToArray(),
            new ValueComparer<float[]?>(
                (a, b) => (a == null && b == null) || (a != null && b != null && a.SequenceEqual(b)),
                v => v == null ? 0 : v.Aggregate(0, HashCode.Combine),
                v => v == null ? null : v.ToArray()));

        property.HasColumnType($"vector({EmbeddingDimensions})");
    }

    private void ConfigureRequiredVectorProperty(PropertyBuilder<float[]> property)
    {
        property.HasConversion(
            v => new Vector(v),
            v => v.ToArray(),
            new ValueComparer<float[]>(
                (a, b) => a!.SequenceEqual(b!),
                v => v.Aggregate(0, HashCode.Combine),
                v => v.ToArray()));

        property.HasColumnType($"vector({EmbeddingDimensions})");
    }
}

using Microsoft.EntityFrameworkCore;
using MovieCatalog.Application.Statistics;
using MovieCatalog.Contracts.Statistics;
using MovieCatalog.Infrastructure.Persistence;

namespace MovieCatalog.Infrastructure.Statistics;

public class StatisticsRepository(AppDbContext db) : IStatisticsRepository
{
    private const int TopN = 20;

    public async Task<StatisticsDto> GetStatisticsAsync(CancellationToken ct)
    {
        var today = DateTimeOffset.UtcNow.Date;

        var totalMovies = await db.Movies.CountAsync(ct);
        var addedToday = await db.Movies.CountAsync(m => m.CreatedAt.Date == today, ct);
        var updatedToday = await db.Movies.CountAsync(m => m.UpdatedAt.Date == today && m.CreatedAt.Date != today, ct);
        var totalSources = await db.Sources.CountAsync(ct);
        var lastCrawlAt = await db.Sources.Where(s => s.LastCrawlAt != null).MaxAsync(s => (DateTimeOffset?)s.LastCrawlAt, ct);
        var withEmbedding = await db.Movies.CountAsync(m => m.Embedding != null, ct);
        var pendingEmbedding = totalMovies - withEmbedding;
        var totalClusters = await db.MovieClusters.CountAsync(ct);

        var byGenre = await db.Set<Domain.Entities.MovieGenre>()
            .GroupBy(mg => mg.Genre!.Name)
            .Select(g => new NamedCountDto { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(TopN)
            .ToListAsync(ct);

        var byYear = await db.Movies
            .Where(m => m.Year != null)
            .GroupBy(m => m.Year!.Value)
            .Select(g => new NamedCountDto { Name = g.Key.ToString(), Count = g.Count() })
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        var byRating = await db.Movies
            .Where(m => m.Rating != null)
            .GroupBy(m => (int)Math.Floor(m.Rating!.Value))
            .Select(g => new NamedCountDto { Name = g.Key.ToString(), Count = g.Count() })
            .OrderBy(x => x.Name)
            .ToListAsync(ct);

        var bySource = await db.Movies
            .GroupBy(m => m.Source!.Name)
            .Select(g => new NamedCountDto { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(ct);

        return new StatisticsDto
        {
            TotalMovies = totalMovies,
            MoviesAddedToday = addedToday,
            MoviesUpdatedToday = updatedToday,
            TotalSources = totalSources,
            LastCrawlAt = lastCrawlAt,
            MoviesWithEmbedding = withEmbedding,
            MoviesPendingEmbedding = pendingEmbedding,
            TotalClusters = totalClusters,
            ByGenre = byGenre,
            ByYear = byYear,
            ByRating = byRating,
            BySource = bySource
        };
    }
}

using Microsoft.EntityFrameworkCore;
using MovieCatalog.Application.Common;
using MovieCatalog.Application.Movies;
using MovieCatalog.Domain.Entities;
using MovieCatalog.Infrastructure.Persistence;

namespace MovieCatalog.Infrastructure.Movies;

public class MovieRepository(AppDbContext db) : IMovieRepository
{
    public Task<Movie?> GetByIdAsync(int id, CancellationToken ct) =>
        FullMovieQuery().FirstOrDefaultAsync(m => m.Id == id, ct);

    // Deve caricare le stesse relazioni di FullMovieQuery: il chiamante (MovieService.UpsertFromCrawlAsync)
    // fa Genres/Directors/Cast/Crew/Keywords.Clear() sul risultato per poi re-inserirli. Su una collezione non
    // caricata Clear() non ha nulla da cancellare (bug reale osservato: le vecchie righe restavano nel DB e il
    // re-insert di un membro invariato, es. un attore ancora nel cast, violava la chiave composita).
    public Task<Movie?> GetBySourceAndExternalIdAsync(int sourceId, string externalId, CancellationToken ct) =>
        FullMovieQuery().FirstOrDefaultAsync(m => m.SourceId == sourceId && m.ExternalId == externalId, ct);

    public async Task<(IReadOnlyCollection<Movie> Items, int Total)> GetPagedAsync(int page, int pageSize, CancellationToken ct)
    {
        var query = FullMovieQuery().OrderByDescending(m => m.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return (items, total);
    }

    public async Task<Source> GetOrCreateSourceAsync(string sourceName, CancellationToken ct)
    {
        var existing = await db.Sources.FirstOrDefaultAsync(s => s.Name == sourceName, ct);
        if (existing is not null)
        {
            return existing;
        }

        var source = new Source
        {
            Name = sourceName,
            BaseUrl = string.Empty,
            AdapterType = "Manual",
            Enabled = true
        };

        db.Sources.Add(source);
        await db.SaveChangesAsync(ct);
        return source;
    }

    public async Task<Genre> GetOrCreateGenreAsync(string name, CancellationToken ct)
    {
        var normalized = TextNormalizer.Normalize(name);
        var existing = await db.Genres.FirstOrDefaultAsync(g => g.NormalizedName == normalized, ct);
        if (existing is not null)
        {
            return existing;
        }

        var genre = new Genre { Name = name, NormalizedName = normalized };
        db.Genres.Add(genre);
        await db.SaveChangesAsync(ct);
        return genre;
    }

    public async Task<Person> GetOrCreatePersonAsync(string name, CancellationToken ct)
    {
        var normalized = TextNormalizer.Normalize(name);
        var existing = await db.People.FirstOrDefaultAsync(p => p.NormalizedName == normalized, ct);
        if (existing is not null)
        {
            return existing;
        }

        var person = new Person { Name = name, NormalizedName = normalized };
        db.People.Add(person);
        await db.SaveChangesAsync(ct);
        return person;
    }

    public async Task<IReadOnlyCollection<Movie>> GetMoviesPendingEmbeddingAsync(int limit, CancellationToken ct) =>
        await FullMovieQuery()
            .Where(m => m.Embedding == null)
            .OrderBy(m => m.Id)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<Keyword> GetOrCreateKeywordAsync(string name, CancellationToken ct)
    {
        var normalized = TextNormalizer.Normalize(name);
        var existing = await db.Keywords.FirstOrDefaultAsync(k => k.NormalizedName == normalized, ct);
        if (existing is not null)
        {
            return existing;
        }

        var keyword = new Keyword { Name = name, NormalizedName = normalized };
        db.Keywords.Add(keyword);
        await db.SaveChangesAsync(ct);
        return keyword;
    }

    public async Task<Movie?> FindPotentialDuplicateAsync(string title, int? year, int excludingSourceId, CancellationToken ct)
    {
        var normalizedTitle = TextNormalizer.Normalize(title);

        var candidates = await db.Movies
            .Include(m => m.Source)
            .Where(m => m.SourceId != excludingSourceId && m.Year == year)
            .ToListAsync(ct);

        return candidates.FirstOrDefault(m => m.NormalizedTitle == normalizedTitle);
    }

    public void Add(Movie movie) => db.Movies.Add(movie);

    public void Remove(Movie movie) => db.Movies.Remove(movie);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);

    // AsSplitQuery: 5 collection Include insieme genererebbero un prodotto cartesiano in una singola query SQL
    // (rilevato dall'osservabilità di Fase 9 come EF warning); query separate per collezione sono corrette e più veloci qui.
    private IQueryable<Movie> FullMovieQuery() =>
        db.Movies
            .Include(m => m.Source)
            .Include(m => m.Cluster)
            .Include(m => m.Genres).ThenInclude(g => g.Genre)
            .Include(m => m.Keywords).ThenInclude(k => k.Keyword)
            .Include(m => m.Directors).ThenInclude(d => d.Person)
            .Include(m => m.Crew).ThenInclude(c => c.Person)
            .Include(m => m.Cast).ThenInclude(c => c.Person)
            .AsSplitQuery();
}

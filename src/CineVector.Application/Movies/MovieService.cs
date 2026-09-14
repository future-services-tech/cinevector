using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using CineVector.Application.Common;
using CineVector.Application.Crawling;
using CineVector.Application.Embeddings;
using CineVector.Application.People;
using CineVector.Contracts;
using CineVector.Contracts.Movies;
using CineVector.Domain.Entities;
using CineVector.Domain.Enums;

namespace CineVector.Application.Movies;

public record MovieUpsertResult(MovieDto Movie, bool WasCreated, bool WasChanged);

public class MovieService(IMovieRepository repository, ILogger<MovieService> logger, IWikipediaLookupService wikipediaLookup)
{
    public async Task<MovieDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        var movie = await repository.GetByIdAsync(id, ct);
        return movie is null ? null : MovieMapper.ToDto(movie);
    }

    public async Task<PagedResult<MovieSummaryDto>> GetPagedAsync(int page, int pageSize, CancellationToken ct)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var (items, total) = await repository.GetPagedAsync(page, pageSize, ct);

        return new PagedResult<MovieSummaryDto>
        {
            Items = items.Select(MovieMapper.ToSummaryDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<MovieDto> CreateAsync(UpsertMovieRequest request, CancellationToken ct)
    {
        var source = await repository.GetOrCreateSourceAsync(request.SourceName, ct);

        var existing = await repository.GetBySourceAndExternalIdAsync(source.Id, request.ExternalId, ct);
        if (existing is not null)
        {
            throw new InvalidOperationException(
                $"Esiste già un film per la fonte '{request.SourceName}' con ExternalId '{request.ExternalId}'.");
        }

        var now = DateTimeOffset.UtcNow;
        var movie = new Movie
        {
            SourceId = source.Id,
            ExternalId = request.ExternalId,
            Title = request.Title,
            NormalizedTitle = TextNormalizer.Normalize(request.Title),
            OriginalTitle = request.OriginalTitle,
            Year = request.Year,
            Overview = request.Overview,
            Rating = request.Rating,
            PosterUrl = request.PosterUrl,
            BackdropUrl = request.BackdropUrl,
            PlatformUrl = request.PlatformUrl,
            Language = request.Language,
            Country = request.Country,
            CreatedAt = now,
            UpdatedAt = now,
            LastSeenAt = now
        };

        await ApplyRelationsAsync(
            movie, request.Genres, request.Directors.Select(d => new MoviePersonRef(d)), request.Keywords,
            request.Cast.Select(c => (c.Name, c.Character, c.BillingOrder, c.ProfileUrl)),
            request.Crew.Select(c => (c.Name, ParseCrewRole(c.Role))).Where(c => c.Item2.HasValue)
                .Select(c => (c.Name, c.Item2!.Value, (string?)null)),
            ct);

        repository.Add(movie);
        await repository.SaveChangesAsync(ct);

        var saved = await repository.GetByIdAsync(movie.Id, ct);
        await RefreshEmbeddingTextAsync(saved!, ct);
        return MovieMapper.ToDto(saved!);
    }

    public async Task<MovieDto?> UpdateAsync(int id, UpsertMovieRequest request, CancellationToken ct)
    {
        var movie = await repository.GetByIdAsync(id, ct);
        if (movie is null)
        {
            return null;
        }

        var source = await repository.GetOrCreateSourceAsync(request.SourceName, ct);

        movie.SourceId = source.Id;
        movie.ExternalId = request.ExternalId;
        movie.Title = request.Title;
        movie.NormalizedTitle = TextNormalizer.Normalize(request.Title);
        movie.OriginalTitle = request.OriginalTitle;
        movie.Year = request.Year;
        movie.Overview = request.Overview;
        movie.Rating = request.Rating;
        movie.PosterUrl = request.PosterUrl;
        movie.BackdropUrl = request.BackdropUrl;
        movie.PlatformUrl = request.PlatformUrl;
        movie.Language = request.Language;
        movie.Country = request.Country;
        movie.UpdatedAt = DateTimeOffset.UtcNow;

        movie.Genres.Clear();
        movie.Directors.Clear();
        movie.Cast.Clear();
        movie.Crew.Clear();
        movie.Keywords.Clear();

        await ApplyRelationsAsync(
            movie, request.Genres, request.Directors.Select(d => new MoviePersonRef(d)), request.Keywords,
            request.Cast.Select(c => (c.Name, c.Character, c.BillingOrder, c.ProfileUrl)),
            request.Crew.Select(c => (c.Name, ParseCrewRole(c.Role))).Where(c => c.Item2.HasValue)
                .Select(c => (c.Name, c.Item2!.Value, (string?)null)),
            ct);

        await repository.SaveChangesAsync(ct);

        var saved = await repository.GetByIdAsync(movie.Id, ct);
        await RefreshEmbeddingTextAsync(saved!, ct);
        return MovieMapper.ToDto(saved!);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var movie = await repository.GetByIdAsync(id, ct);
        if (movie is null)
        {
            return false;
        }

        repository.Remove(movie);
        await repository.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>Crea o aggiorna un film a partire dai metadati estratti da un <see cref="ISourceAdapter"/>.
    /// A differenza di <see cref="CreateAsync"/> non fallisce su un duplicato (SourceId, ExternalId): aggiorna
    /// il film esistente solo se l'hash dei metadati è cambiato, altrimenti si limita a marcare LastSeenAt.</summary>
    public async Task<MovieUpsertResult> UpsertFromCrawlAsync(string sourceName, MovieMetadata metadata, CancellationToken ct)
    {
        var source = await repository.GetOrCreateSourceAsync(sourceName, ct);
        var existing = await repository.GetBySourceAndExternalIdAsync(source.Id, metadata.ExternalId, ct);
        var newHash = ComputeMetadataHash(metadata);
        var now = DateTimeOffset.UtcNow;

        if (existing is null)
        {
            var duplicate = await repository.FindPotentialDuplicateAsync(metadata.Title, metadata.Year, source.Id, ct);
            if (duplicate is not null)
            {
                logger.LogWarning(
                    "Possibile duplicato: '{Title}' ({Year}) dalla fonte {Source} assomiglia al film Id={ExistingMovieId} già presente dalla fonte {ExistingSource}",
                    metadata.Title, metadata.Year, sourceName, duplicate.Id, duplicate.Source?.Name);
            }

            var movie = new Movie
            {
                SourceId = source.Id,
                ExternalId = metadata.ExternalId,
                Title = metadata.Title,
                NormalizedTitle = TextNormalizer.Normalize(metadata.Title),
                OriginalTitle = metadata.OriginalTitle,
                Year = metadata.Year,
                Overview = metadata.Overview,
                Rating = metadata.Rating,
                PosterUrl = metadata.PosterUrl,
                BackdropUrl = metadata.BackdropUrl,
                PlatformUrl = metadata.PlatformUrl,
                Language = metadata.Language,
                Country = metadata.Country,
                MetadataHash = newHash,
                CreatedAt = now,
                UpdatedAt = now,
                LastSeenAt = now
            };

            await ApplyRelationsAsync(
                movie, metadata.Genres, metadata.Directors, metadata.Keywords,
                metadata.Cast.Select(c => (c.Name, c.Character, c.BillingOrder, c.ProfileUrl)),
                metadata.Crew.Select(c => (c.Name, c.Role, c.ProfileUrl)),
                ct);

            repository.Add(movie);
            await repository.SaveChangesAsync(ct);

            var saved = await repository.GetByIdAsync(movie.Id, ct);
            await RefreshEmbeddingTextAsync(saved!, ct);
            logger.LogInformation("Film creato: '{Title}' ({Year}) da {Source}", metadata.Title, metadata.Year, sourceName);
            return new MovieUpsertResult(MovieMapper.ToDto(saved!), true, false);
        }

        existing.LastSeenAt = now;

        if (existing.MetadataHash == newHash)
        {
            await repository.SaveChangesAsync(ct);
            return new MovieUpsertResult(MovieMapper.ToDto(existing), false, false);
        }

        existing.Title = metadata.Title;
        existing.NormalizedTitle = TextNormalizer.Normalize(metadata.Title);
        existing.OriginalTitle = metadata.OriginalTitle;
        existing.Year = metadata.Year;
        existing.Overview = metadata.Overview;
        existing.Rating = metadata.Rating;
        existing.PosterUrl = metadata.PosterUrl;
        existing.BackdropUrl = metadata.BackdropUrl;
        existing.Language = metadata.Language;
        existing.Country = metadata.Country;
        existing.MetadataHash = newHash;
        existing.UpdatedAt = now;

        existing.Genres.Clear();
        existing.Directors.Clear();
        existing.Cast.Clear();
        existing.Crew.Clear();
        existing.Keywords.Clear();

        await ApplyRelationsAsync(
            existing, metadata.Genres, metadata.Directors, metadata.Keywords,
            metadata.Cast.Select(c => (c.Name, c.Character, c.BillingOrder, c.ProfileUrl)),
            metadata.Crew.Select(c => (c.Name, c.Role, c.ProfileUrl)),
            ct);

        await repository.SaveChangesAsync(ct);

        var updated = await repository.GetByIdAsync(existing.Id, ct);
        await RefreshEmbeddingTextAsync(updated!, ct);
        logger.LogInformation("Film aggiornato (metadati cambiati): '{Title}' ({Year}) da {Source}", metadata.Title, metadata.Year, sourceName);
        return new MovieUpsertResult(MovieMapper.ToDto(updated!), false, true);
    }

    private async Task ApplyRelationsAsync(
        Movie movie,
        IEnumerable<string> genres,
        IEnumerable<MoviePersonRef> directors,
        IEnumerable<string> keywords,
        IEnumerable<(string Name, string? Character, int BillingOrder, string? ProfileUrl)> cast,
        IEnumerable<(string Name, CrewRole Role, string? ProfileUrl)> crew,
        CancellationToken ct)
    {
        // Deduplica per ID *risolto*, non per nome grezzo: due nomi diversi in ingresso (varianti, sinonimi,
        // refusi della fonte) possono normalizzare allo stesso Genre/Keyword/Person già esistente. Aggiungere due
        // righe di relazione per lo stesso ID fa esplodere EF già in Add(movie) ("entity already tracked", perché
        // la PK di queste tabelle è la sola coppia di ID) — bug reale osservato sia su cast/crew sia su keyword.
        var seenGenreIds = new HashSet<int>();
        foreach (var genreName in genres.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var genre = await repository.GetOrCreateGenreAsync(genreName, ct);
            if (seenGenreIds.Add(genre.Id))
            {
                movie.Genres.Add(new MovieGenre { GenreId = genre.Id, Movie = movie });
            }
        }

        var seenKeywordIds = new HashSet<int>();
        foreach (var keywordName in keywords.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var keyword = await repository.GetOrCreateKeywordAsync(keywordName, ct);
            if (seenKeywordIds.Add(keyword.Id))
            {
                movie.Keywords.Add(new MovieKeyword { KeywordId = keyword.Id, Movie = movie });
            }
        }

        var seenDirectorIds = new HashSet<int>();
        foreach (var director in directors.DistinctBy(d => d.Name, StringComparer.OrdinalIgnoreCase))
        {
            var person = await repository.GetOrCreatePersonAsync(director.Name, ct);
            await EnrichPersonIfNeededAsync(person, director.ProfileUrl, ct);
            if (seenDirectorIds.Add(person.Id))
            {
                movie.Directors.Add(new MovieDirector { PersonId = person.Id, Movie = movie });
            }
        }

        var seenCastPersonIds = new HashSet<int>();
        foreach (var (name, character, billingOrder, profileUrl) in cast)
        {
            var person = await repository.GetOrCreatePersonAsync(name, ct);
            await EnrichPersonIfNeededAsync(person, profileUrl, ct);
            if (seenCastPersonIds.Add(person.Id))
            {
                movie.Cast.Add(new MovieCast { PersonId = person.Id, Movie = movie, Character = character, BillingOrder = billingOrder });
            }
        }

        var seenCrewKeys = new HashSet<(int PersonId, CrewRole Role)>();
        foreach (var (name, role, profileUrl) in crew)
        {
            var person = await repository.GetOrCreatePersonAsync(name, ct);
            await EnrichPersonIfNeededAsync(person, profileUrl, ct);
            if (seenCrewKeys.Add((person.Id, role)))
            {
                movie.Crew.Add(new Domain.Entities.MovieCrew { PersonId = person.Id, Movie = movie, Role = role });
            }
        }
    }

    /// <summary>Foto profilo e pagina Wikipedia sono attributi della persona (condivisi tra tutti i suoi film e
    /// ruoli — regista, attore, produttore...), non del singolo credito in questo film. La foto si aggiorna ogni
    /// volta che la fonte ne fornisce una nuova; la ricerca Wikipedia viene invece tentata una sola volta per
    /// persona (finché <see cref="Person.InfoUpdatedAt"/> è null) — dopo il primo tentativo, riuscito o meno, non
    /// si ripete più: evita di richiamare Wikipedia all'infinito per chi non ha una voce enciclopedica.</summary>
    private async Task EnrichPersonIfNeededAsync(Person person, string? profileUrl, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(profileUrl) && person.ProfileUrl != profileUrl)
        {
            person.ProfileUrl = profileUrl;
        }

        if (person.InfoUpdatedAt is null)
        {
            person.WikipediaUrl = await wikipediaLookup.FindArticleUrlAsync(person.Name, ct);
            person.InfoUpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    /// <summary>Ricalcola il testo di embedding e, se cambiato, invalida il vettore esistente così che
    /// <c>EmbeddingIndexingService</c> lo rigeneri. Richiede che <paramref name="movie"/> sia stato ricaricato
    /// con le relazioni incluse (Genres, Directors, Cast, Keywords).</summary>
    private async Task RefreshEmbeddingTextAsync(Movie movie, CancellationToken ct)
    {
        var newText = EmbeddingTextBuilder.Build(movie);
        if (newText == movie.EmbeddingText)
        {
            return;
        }

        movie.EmbeddingText = newText;
        movie.Embedding = null;
        await repository.SaveChangesAsync(ct);
    }

    private static CrewRole? ParseCrewRole(string role) =>
        Enum.TryParse<CrewRole>(role, ignoreCase: true, out var parsed) ? parsed : null;

    private static string ComputeMetadataHash(MovieMetadata metadata)
    {
        var builder = new StringBuilder();
        builder.Append(metadata.Title).Append('|');
        builder.Append(metadata.OriginalTitle).Append('|');
        builder.Append(metadata.Year).Append('|');
        builder.Append(metadata.Overview).Append('|');
        builder.Append(metadata.Rating).Append('|');
        builder.Append(metadata.PosterUrl).Append('|');
        builder.Append(metadata.BackdropUrl).Append('|');
        builder.Append(metadata.Language).Append('|');
        builder.Append(metadata.Country).Append('|');
        builder.Append(string.Join(',', metadata.Genres.OrderBy(g => g, StringComparer.OrdinalIgnoreCase))).Append('|');
        builder.Append(string.Join(',', metadata.Keywords.OrderBy(k => k, StringComparer.OrdinalIgnoreCase))).Append('|');
        builder.Append(string.Join(',', metadata.Directors.OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase).Select(d => $"{d.Name}:{d.ProfileUrl}"))).Append('|');
        builder.Append(string.Join(',', metadata.Crew.Select(c => $"{c.Name}:{c.Role}:{c.ProfileUrl}").OrderBy(c => c, StringComparer.OrdinalIgnoreCase))).Append('|');
        builder.Append(string.Join(',', metadata.Cast.OrderBy(c => c.BillingOrder).Select(c => $"{c.Name}:{c.Character}:{c.ProfileUrl}")));

        var bytes = Encoding.UTF8.GetBytes(builder.ToString());
        return Convert.ToHexStringLower(SHA256.HashData(bytes));
    }
}

using CineVector.Contracts.Sources;
using CineVector.Domain.Entities;

namespace CineVector.Application.Sources;

public class SourceService(ISourceRepository repository)
{
    public async Task<IReadOnlyCollection<SourceDto>> GetAllAsync(CancellationToken ct)
    {
        var sources = await repository.GetAllAsync(ct);
        return sources.Select(ToDto).ToList();
    }

    public async Task<SourceDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        var source = await repository.GetByIdAsync(id, ct);
        return source is null ? null : ToDto(source);
    }

    public async Task<SourceDto> CreateAsync(UpsertSourceRequest request, CancellationToken ct)
    {
        var source = new Source
        {
            Name = request.Name,
            BaseUrl = request.BaseUrl,
            Enabled = request.Enabled,
            AdapterType = request.AdapterType
        };

        repository.Add(source);
        await repository.SaveChangesAsync(ct);
        return ToDto(source);
    }

    public async Task<SourceDto?> UpdateAsync(int id, UpsertSourceRequest request, CancellationToken ct)
    {
        var source = await repository.GetByIdAsync(id, ct);
        if (source is null)
        {
            return null;
        }

        source.Name = request.Name;
        source.BaseUrl = request.BaseUrl;
        source.Enabled = request.Enabled;
        source.AdapterType = request.AdapterType;

        await repository.SaveChangesAsync(ct);
        return ToDto(source);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var source = await repository.GetByIdAsync(id, ct);
        if (source is null)
        {
            return false;
        }

        repository.Remove(source);
        await repository.SaveChangesAsync(ct);
        return true;
    }

    private static SourceDto ToDto(Source source) => new()
    {
        Id = source.Id,
        Name = source.Name,
        BaseUrl = source.BaseUrl,
        Enabled = source.Enabled,
        AdapterType = source.AdapterType,
        LastCrawlAt = source.LastCrawlAt
    };
}

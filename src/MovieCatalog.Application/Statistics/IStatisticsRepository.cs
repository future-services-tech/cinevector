using MovieCatalog.Contracts.Statistics;

namespace MovieCatalog.Application.Statistics;

public interface IStatisticsRepository
{
    Task<StatisticsDto> GetStatisticsAsync(CancellationToken ct);
}

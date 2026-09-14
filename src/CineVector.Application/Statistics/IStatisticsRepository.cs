using CineVector.Contracts.Statistics;

namespace CineVector.Application.Statistics;

public interface IStatisticsRepository
{
    Task<StatisticsDto> GetStatisticsAsync(CancellationToken ct);
}

using CineVector.Contracts.Crawling;
using CineVector.Domain.Entities;

namespace CineVector.Application.Crawling;

public static class CrawlJobMapper
{
    public static CrawlJobDto ToDto(CrawlJob job) => new()
    {
        Id = job.Id,
        SourceId = job.SourceId,
        SourceName = job.Source?.Name,
        StartedAt = job.StartedAt,
        CompletedAt = job.CompletedAt,
        Status = job.Status.ToString(),
        QueryMode = job.QueryMode.ToString(),
        Query = job.Query,
        PagesVisited = job.PagesVisited,
        MoviesFound = job.MoviesFound,
        MoviesCreated = job.MoviesCreated,
        MoviesUpdated = job.MoviesUpdated,
        Errors = job.Errors.Select(e => new CrawlErrorDto
        {
            Url = e.Url,
            ErrorType = e.ErrorType,
            Message = e.Message,
            CreatedAt = e.CreatedAt
        }).ToList()
    };
}

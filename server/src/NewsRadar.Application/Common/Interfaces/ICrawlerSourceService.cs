using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

public interface ICrawlerSourceService
{
    Task<IEnumerable<CrawlerSourceDto>> GetAllSourcesAsync(CancellationToken cancellationToken = default);
    Task<CrawlerSourceDto?> GetSourceByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<CrawlerSourceDto> CreateSourceAsync(CreateCrawlerSourceDto dto, CancellationToken cancellationToken = default);
    Task<CrawlerSourceDto> UpdateSourceAsync(string id, UpdateCrawlerSourceDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteSourceAsync(string id, CancellationToken cancellationToken = default);
    Task<bool> ToggleSourceStatusAsync(string id, bool isActive, CancellationToken cancellationToken = default);
}
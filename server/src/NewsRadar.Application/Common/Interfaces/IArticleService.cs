using NewsRadar.Application.Common.DTOs;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Application.Common.Interfaces;

public interface IArticleService
{
    Task<CursorPagedResult<ArticleDto>> GetArticlesAsync(ArticleFilterParams filter);
    Task<ArticleDto?> GetArticleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ArticleExistsAsync(string urlHash, CancellationToken cancellationToken = default);
    Task ProcessAndBroadcastArticleAsync(Article article, CancellationToken cancellationToken = default);
    Task<bool> TogglePinArticleAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ArticleDto> OverrideArticleMetadataAsync(Guid id, string? category, string? sentimentLabel, CancellationToken cancellationToken = default);

}
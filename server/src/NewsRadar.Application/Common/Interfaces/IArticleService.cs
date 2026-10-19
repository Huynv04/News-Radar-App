using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Interfaces;

public interface IArticleService
{
    Task<CursorPagedResult<ArticleDto>> GetArticlesAsync(ArticleFilterParams filter);
}
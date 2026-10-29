using MediatR;
using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Events;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Infrastructure.Services;

public class ArticleService : IArticleService
{
    private readonly ApplicationDbContext _context;
    private readonly IMediator _mediator;

    public ArticleService(ApplicationDbContext context, IMediator mediator)
    {
        _context  = context;
        _mediator = mediator;
    }

    /// <inheritdoc/>
    public async Task<CursorPagedResult<ArticleDto>> GetArticlesAsync(ArticleFilterParams filter)
    {
        var query = _context.Articles
            .Include(a => a.CrawlerSource)
            .AsNoTracking();

        // Filter: Nguon tin
        if (!string.IsNullOrWhiteSpace(filter.SourceId))
            query = query.Where(a => a.CrawlerSourceId == filter.SourceId);

        // Filter: Tu khoa (Title + Sapo + Content + Author)
        if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
        {
            var kw = filter.SearchKeyword.Trim();
            if (_context.Database.IsNpgsql())
            {
                query = query.Where(a =>
                    EF.Functions.ILike(a.Title, $"%{kw}%") ||
                    EF.Functions.ILike(a.Sapo, $"%{kw}%") ||
                    (a.Content != null && EF.Functions.ILike(a.Content, $"%{kw}%")) ||
                    (a.Author != null && EF.Functions.ILike(a.Author, $"%{kw}%")));
            }
            else
            {
                var lowerKw = kw.ToLower();
                query = query.Where(a =>
                    a.Title.ToLower().Contains(lowerKw) ||
                    a.Sapo.ToLower().Contains(lowerKw) ||
                    (a.Content != null && a.Content.ToLower().Contains(lowerKw)) ||
                    (a.Author != null && a.Author.ToLower().Contains(lowerKw)));
            }
        }

        // Filter: Sentiment
        if (!string.IsNullOrWhiteSpace(filter.Sentiment))
            query = query.Where(a => a.SentimentLabel == filter.Sentiment);

        // Filter: Category
        if (!string.IsNullOrWhiteSpace(filter.Category))
            query = query.Where(a => a.Category == filter.Category);

        // Filter: Khoang thoi gian
        if (filter.FromDate.HasValue)
            query = query.Where(a => a.PublishedAt >= filter.FromDate.Value);
        if (filter.ToDate.HasValue)
            query = query.Where(a => a.PublishedAt <= filter.ToDate.Value);

        // Keyset Pagination cursor condition
        if (filter.LastPublishedAt.HasValue && filter.LastId.HasValue)
        {
            var lastPub = filter.LastPublishedAt.Value;
            var lastId  = filter.LastId.Value;
            query = query.Where(a =>
                a.PublishedAt < lastPub ||
                (a.PublishedAt == lastPub && a.Id < lastId));
        }

        // Ưu tiên bài ghim (IsPinned = true) lên trước, sau đó sắp xếp theo PublishedAt và Id
        query = query.OrderByDescending(a => a.IsPinned)
                     .ThenByDescending(a => a.PublishedAt)
                     .ThenByDescending(a => a.Id);

        var pageSize = Math.Clamp(filter.PageSize, 1, 50);
        var items = await query
            .Take(pageSize + 1)
            .Select(a => new ArticleDto
            {
                Id                = a.Id,
                Title             = a.Title,
                Sapo              = a.Sapo,
                Content           = a.Content,
                Url               = a.Url,
                Category          = a.Category,
                PublishedAt       = a.PublishedAt,
                CrawledAt         = a.CrawledAt,
                CrawlerSourceId   = a.CrawlerSourceId,
                CrawlerSourceName = a.CrawlerSource != null ? a.CrawlerSource.Name : "N/A",
                ContentHash       = a.ContentHash,
                IsPinned          = a.IsPinned,
                SentimentLabel    = a.SentimentLabel,
                SentimentScore    = a.SentimentScore,
                TrendScore        = a.TrendScore,
                Author            = a.Author,
                ImageUrl          = a.ImageUrl,
                ClusterId         = a.ClusterId,
                ClusterCount      = a.ClusterCount,
            })
            .ToListAsync();

        bool hasNextPage = items.Count > pageSize;
        if (hasNextPage) items.RemoveAt(items.Count - 1);

        var lastItem = items.LastOrDefault();
        return new CursorPagedResult<ArticleDto>
        {
            Items               = items,
            NextLastPublishedAt = lastItem?.PublishedAt,
            NextLastId          = lastItem?.Id,
            HasNextPage         = hasNextPage,
        };
    }

    /// <inheritdoc/>
    public async Task<ArticleDto?> GetArticleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Articles
            .Include(a => a.CrawlerSource)
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new ArticleDto
            {
                Id                = a.Id,
                Title             = a.Title,
                Sapo              = a.Sapo,
                Content           = a.Content,
                Url               = a.Url,
                Category          = a.Category,
                PublishedAt       = a.PublishedAt,
                CrawledAt         = a.CrawledAt,
                CrawlerSourceId   = a.CrawlerSourceId,
                CrawlerSourceName = a.CrawlerSource != null ? a.CrawlerSource.Name : "N/A",
                IsPinned          = a.IsPinned,
                ContentHash       = a.ContentHash,
                SentimentLabel    = a.SentimentLabel,
                SentimentScore    = a.SentimentScore,
                TrendScore        = a.TrendScore,
                Author            = a.Author,
                ImageUrl          = a.ImageUrl,
                ClusterId         = a.ClusterId,
                ClusterCount      = a.ClusterCount,
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<bool> ArticleExistsAsync(string urlHash, CancellationToken cancellationToken = default)
        => await _context.Articles.AnyAsync(a => a.UrlHash == urlHash, cancellationToken);

    /// <inheritdoc/>
    public async Task ProcessAndBroadcastArticleAsync(Article article, CancellationToken cancellationToken = default)
    {
        _context.Articles.Add(article);
        await _context.SaveChangesAsync(cancellationToken);

        // Broadcast qua MediatR -> SignalR nếu là Tin Nóng (TrendScore >= 45 hoặc tiêu đề chứa từ khóa khẩn/nóng)
        bool isHot = article.TrendScore >= 45.0 ||
                     article.Title.Contains("khẩn", StringComparison.OrdinalIgnoreCase) ||
                     article.Title.Contains("nóng", StringComparison.OrdinalIgnoreCase);

        if (isHot)
        {
            var source = await _context.CrawlerSources
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == article.CrawlerSourceId, cancellationToken);

            await _mediator.Publish(new HotArticleDetectedEvent
            {
                ArticleId   = article.Id,
                Title       = article.Title,
                TrendScore  = article.TrendScore,
                SourceName  = source?.Name ?? "N/A",
                PublishedAt = article.PublishedAt,
            }, cancellationToken);
        }
    }
     /// <inheritdoc/>
    public async Task<bool> TogglePinArticleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var article = await _context.Articles.FindAsync([id], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy bài viết với Id '{id}'");

        article.IsPinned = !article.IsPinned;
        await _context.SaveChangesAsync(cancellationToken);

        return article.IsPinned;
    }
    public async Task<ArticleDto> OverrideArticleMetadataAsync(Guid id, string? category, string? sentimentLabel, CancellationToken cancellationToken = default)
{
    var article = await _context.Articles
        .Include(a => a.CrawlerSource)
        .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    if (article == null)
    {
        throw new KeyNotFoundException($"Article with ID '{id}' was not found.");
    }

    if (!string.IsNullOrWhiteSpace(category))
    {
        article.Category = category.Trim();
    }

    if (!string.IsNullOrWhiteSpace(sentimentLabel))
    {
        article.SentimentLabel = sentimentLabel.Trim();
    }

    await _context.SaveChangesAsync(cancellationToken);

    return new ArticleDto
    {
        Id                = article.Id,
        Title             = article.Title,
        Sapo              = article.Sapo,
        Content           = article.Content,
        Url               = article.Url,
        PublishedAt       = article.PublishedAt,
        CrawledAt         = article.CrawledAt,
        CrawlerSourceName = article.CrawlerSource?.Name ?? string.Empty,
        CrawlerSourceId   = article.CrawlerSourceId,
        SentimentLabel    = article.SentimentLabel,
        SentimentScore    = article.SentimentScore,
        TrendScore        = article.TrendScore,
        Category          = article.Category,
        IsPinned          = article.IsPinned,
        Author            = article.Author,
        ImageUrl          = article.ImageUrl,
        ClusterId         = article.ClusterId,
        ClusterCount      = article.ClusterCount
    };
}

}

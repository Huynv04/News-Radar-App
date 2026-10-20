using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Interfaces;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Application.Common.Interfaces;
using MediatR;
using NewsRadar.Application.Common.Events;

namespace NewsRadar.Infrastructure.Services;

public class ArticleService : IArticleService
{
    private readonly ApplicationDbContext _context;
    private readonly IMediator _mediator;

    public ArticleService(
        ApplicationDbContext context,
        IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<CursorPagedResult<ArticleDto>> GetArticlesAsync(ArticleFilterParams filter)
    {
        var query = _context.Articles
            .Include(a => a.CrawlerSource)
            .AsNoTracking();

        // 1. Lọc theo nguồn tin
        if (!string.IsNullOrWhiteSpace(filter.SourceId))
        {
            query = query.Where(a => a.CrawlerSourceId == filter.SourceId);
        }

        // 2. Tìm kiếm theo từ khóa (Title & Sapo)
        if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
        {
            var keyword = filter.SearchKeyword.Trim().ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(keyword) ||
                                     a.Sapo.ToLower().Contains(keyword));
        }
        // Thêm đoạn lọc Sentiment này ngay dưới phần lọc SearchKeyword trong GetArticlesAsync:
        if (!string.IsNullOrWhiteSpace(filter.Sentiment))
        {
            query = query.Where(a => a.SentimentLabel == filter.Sentiment);
        }

        // 3. Lọc theo khoảng thời gian
        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.PublishedAt >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.PublishedAt <= filter.ToDate.Value);
        }

        // 4. Keyset/Cursor Condition (Sắp xếp PublishedAt DESC, Id DESC)
        if (filter.LastPublishedAt.HasValue && filter.LastId.HasValue)
        {
            var lastPub = filter.LastPublishedAt.Value;
            var lastId = filter.LastId.Value;

            query = query.Where(a =>
                a.PublishedAt < lastPub ||
                (a.PublishedAt == lastPub && a.Id < lastId));
        }

        // Sắp xếp giảm dần theo thời gian xuất bản
        query = query.OrderByDescending(a => a.PublishedAt)
                     .ThenByDescending(a => a.Id);


        // Lấy PageSize + 1 để kiểm tra còn trang sau không (HasNextPage)
        var pageSize = Math.Min(Math.Max(filter.PageSize, 1), 50);
        var items = await query.Take(pageSize + 1)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Sapo = a.Sapo,
                Content = a.Content,
                Url = a.Url,
                PublishedAt = a.PublishedAt,
                CrawledAt = a.CrawledAt,
                CrawlerSourceId = a.CrawlerSourceId,
                CrawlerSourceName = a.CrawlerSource != null ? a.CrawlerSource.Name : "N/A",
                ContentHash = a.ContentHash,
                SentimentLabel = a.SentimentLabel,
                SentimentScore = a.SentimentScore,
                TrendScore = a.TrendScore
            })
            .ToListAsync();

        bool hasNextPage = items.Count > pageSize;
        if (hasNextPage)
        {
            items.RemoveAt(items.Count - 1);
        }

        var lastItem = items.LastOrDefault();

        return new CursorPagedResult<ArticleDto>
        {
            Items = items,
            NextLastPublishedAt = lastItem?.PublishedAt,
            NextLastId = lastItem?.Id,
            HasNextPage = hasNextPage
        };
    }
    public async Task ProcessAndBroadcastArticleAsync(Domain.Entities.Article article)
    {
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        if (article.TrendScore >= 120)
        {
            var source = await _context.CrawlerSources.FindAsync(article.CrawlerSourceId);
            string sourceName = source != null ? source.Name : "N/A";

            // Bắn Domain Event qua MediatR, tuyệt đối sạch Clean Architecture
            await _mediator.Publish(new HotArticleDetectedEvent
            {
                ArticleId = article.Id,
                Title = article.Title,
                TrendScore = article.TrendScore,
                SourceName = sourceName,
                PublishedAt = article.PublishedAt
            });
        }
    }

}
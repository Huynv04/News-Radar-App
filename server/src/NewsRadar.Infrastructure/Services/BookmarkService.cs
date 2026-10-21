using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Infrastructure.Services;

public class BookmarkService : IBookmarkService
{
    private readonly IApplicationDbContext _db;

    public BookmarkService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<BookmarkDto>> GetUserBookmarksAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _db.Bookmarks
            .Where(b => b.UserId == userId)
            .Include(b => b.Article)
                .ThenInclude(a => a.CrawlerSource)
            .OrderByDescending(b => b.SavedAt)
            .Select(b => new BookmarkDto(
                b.Id,
                b.ArticleId,
                b.Article.Title,
                b.Article.Url,
                b.Article.Sapo,
                b.Article.CrawlerSource != null ? b.Article.CrawlerSource.Name : "Unknown",
                b.Article.PublishedAt,
                b.SavedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<BookmarkDto> AddBookmarkAsync(Guid userId, AddBookmarkRequest request, CancellationToken cancellationToken = default)
    {
        // Kiểm tra article có tồn tại không
        var article = await _db.Articles
            .Include(a => a.CrawlerSource)
            .FirstOrDefaultAsync(a => a.Id == request.ArticleId, cancellationToken)
            ?? throw new KeyNotFoundException("Bài viết không tồn tại.");

        // Kiểm tra đã bookmark chưa
        var existing = await _db.Bookmarks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.ArticleId == request.ArticleId, cancellationToken);

        if (existing is not null)
            return new BookmarkDto(
                existing.Id,
                existing.ArticleId,
                article.Title,
                article.Url,
                article.Sapo,
                article.CrawlerSource?.Name ?? "Unknown",
                article.PublishedAt,
                existing.SavedAt
            );

        var bookmark = new Bookmark
        {
            UserId = userId,
            ArticleId = request.ArticleId
        };

        _db.Bookmarks.Add(bookmark);
        await _db.SaveChangesAsync(cancellationToken);

        return new BookmarkDto(
            bookmark.Id,
            bookmark.ArticleId,
            article.Title,
            article.Url,
            article.Sapo,
            article.CrawlerSource?.Name ?? "Unknown",
            article.PublishedAt,
            bookmark.SavedAt
        );
    }

    public async Task RemoveBookmarkAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default)
    {
        var bookmark = await _db.Bookmarks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.ArticleId == articleId, cancellationToken)
            ?? throw new KeyNotFoundException("Bookmark không tồn tại.");

        _db.Bookmarks.Remove(bookmark);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsBookmarkedAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default)
    {
        return await _db.Bookmarks
            .AnyAsync(b => b.UserId == userId && b.ArticleId == articleId, cancellationToken);
    }
}

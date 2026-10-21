using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Infrastructure.Services;

public class ReadingHistoryService : IReadingHistoryService
{
    private readonly ApplicationDbContext _db;

    public ReadingHistoryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task RecordReadAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default)
    {
        var existing = await _db.ReadingHistories
            .FirstOrDefaultAsync(h => h.UserId == userId && h.ArticleId == articleId, cancellationToken);

        if (existing != null)
        {
            existing.ReadAt = DateTime.UtcNow;
        }
        else
        {
            var history = new ReadingHistory
            {
                UserId = userId,
                ArticleId = articleId,
                ReadAt = DateTime.UtcNow
            };
            _db.ReadingHistories.Add(history);
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<ReadingHistoryDto>> GetUserHistoryAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        return await _db.ReadingHistories
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.ReadAt)
            .Take(limit)
            .Include(h => h.Article)
                .ThenInclude(a => a.CrawlerSource)
            .Select(h => new ReadingHistoryDto(
                h.Id,
                h.ArticleId,
                h.Article.Title,
                h.Article.Url,
                h.Article.Sapo,
                h.Article.Category,
                h.Article.CrawlerSource.Name,
                h.Article.PublishedAt,
                h.ReadAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var histories = await _db.ReadingHistories
            .Where(h => h.UserId == userId)
            .ToListAsync(cancellationToken);

        if (histories.Count > 0)
        {
            _db.ReadingHistories.RemoveRange(histories);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}

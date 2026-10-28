using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Infrastructure.Services;

public class CrawlerSourceService : ICrawlerSourceService
{
    private readonly IApplicationDbContext _context;

    public CrawlerSourceService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CrawlerSourceDto>> GetAllSourcesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.CrawlerSources
            .AsNoTracking()
            .Select(s => new CrawlerSourceDto
            {
                Id = s.Id,
                Name = s.Name,
                RssUrl = s.RssUrl,
                BaseUrl = s.BaseUrl,
                IsActive = s.IsActive,
                ScanIntervalMinutes = s.ScanIntervalMinutes,
                Selectors = s.Selectors,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                ConsecutiveFailures = s.ConsecutiveFailures,
                LastScannedAt = s.LastScannedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CrawlerSourceDto?> GetSourceByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var source = await _context.CrawlerSources
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (source == null) return null;

        return new CrawlerSourceDto
        {
            Id = source.Id,
            Name = source.Name,
            RssUrl = source.RssUrl,
            BaseUrl = source.BaseUrl,
            IsActive = source.IsActive,
            ScanIntervalMinutes = source.ScanIntervalMinutes,
            Selectors = source.Selectors,
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.UpdatedAt,
            ConsecutiveFailures = source.ConsecutiveFailures,
            LastScannedAt = source.LastScannedAt
        };
    }

    public async Task<CrawlerSourceDto> CreateSourceAsync(CreateCrawlerSourceDto dto, CancellationToken cancellationToken = default)
    {
        var existingSource = await _context.CrawlerSources
            .AnyAsync(s => s.Id == dto.Id, cancellationToken);

        if (existingSource)
        {
            throw new InvalidOperationException($"Crawler source with ID '{dto.Id}' already exists.");
        }

        var entity = new CrawlerSource
        {
            Id = dto.Id.ToLower().Trim(),
            Name = dto.Name,
            RssUrl = dto.RssUrl,
            BaseUrl = dto.BaseUrl,
            ScanIntervalMinutes = dto.ScanIntervalMinutes,
            Selectors = dto.Selectors,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CrawlerSources.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetSourceByIdAsync(entity.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created crawler source.");
    }

    public async Task<CrawlerSourceDto> UpdateSourceAsync(string id, UpdateCrawlerSourceDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _context.CrawlerSources
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Crawler source with ID '{id}' was not found.");
        }

        entity.Name = dto.Name;
        entity.RssUrl = dto.RssUrl;
        entity.BaseUrl = dto.BaseUrl;
        entity.ScanIntervalMinutes = dto.ScanIntervalMinutes;
        entity.Selectors = dto.Selectors;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new CrawlerSourceDto
        {
            Id = entity.Id,
            Name = entity.Name,
            RssUrl = entity.RssUrl,
            BaseUrl = entity.BaseUrl,
            IsActive = entity.IsActive,
            ScanIntervalMinutes = entity.ScanIntervalMinutes,
            Selectors = entity.Selectors,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<bool> DeleteSourceAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.CrawlerSources
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (entity == null) return false;

        _context.CrawlerSources.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ToggleSourceStatusAsync(string id, bool isActive, CancellationToken cancellationToken = default)
    {
        var entity = await _context.CrawlerSources
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (entity == null)
        {
            throw new KeyNotFoundException($"Crawler source with ID '{id}' was not found.");
        }

        entity.IsActive = isActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
    public async Task<IEnumerable<CrawlerLogDto>> GetLogsAsync(string? sourceId = null, int limit = 50, CancellationToken cancellationToken = default)
{
    var query = _context.CrawlerLogs.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(sourceId))
    {
        query = query.Where(l => l.CrawlerSourceId == sourceId);
    }

    return await query
        .OrderByDescending(l => l.ScannedAt)
        .Take(limit)
        .Select(l => new CrawlerLogDto
        {
            Id = l.Id,
            CrawlerSourceId = l.CrawlerSourceId,
            ScannedAt = l.ScannedAt,
            ArticlesFound = l.ArticlesFound,
            ArticlesInserted = l.ArticlesInserted,
            DurationMs = l.DurationMs,
            IsSuccess = l.IsSuccess,
            ErrorMessage = l.ErrorMessage,
            HttpStatusCode = l.HttpStatusCode
        })
        .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CrawlerHourlyStatDto>> GetHourlyStatsAsync(string? sourceId = null, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var query = _context.CrawlerLogs.AsNoTracking().Where(l => l.ScannedAt >= cutoff);

        if (!string.IsNullOrWhiteSpace(sourceId))
        {
            query = query.Where(l => l.CrawlerSourceId == sourceId);
        }

        var logs = await query.ToListAsync(cancellationToken);

        // Chuẩn bị 24 khung giờ gần nhất
        var result = new List<CrawlerHourlyStatDto>();
        for (int i = 23; i >= 0; i--)
        {
            var targetHour = DateTime.UtcNow.AddHours(-i);
            var hourLabel = targetHour.ToString("HH:00");

            var matchedLogs = logs.Where(l =>
                l.ScannedAt.Year == targetHour.Year &&
                l.ScannedAt.Month == targetHour.Month &&
                l.ScannedAt.Day == targetHour.Day &&
                l.ScannedAt.Hour == targetHour.Hour).ToList();

            result.Add(new CrawlerHourlyStatDto
            {
                Hour = hourLabel,
                SuccessCount = matchedLogs.Count(l => l.IsSuccess),
                FailureCount = matchedLogs.Count(l => !l.IsSuccess),
                TotalArticlesInserted = matchedLogs.Sum(l => l.ArticlesInserted)
            });
        }

        return result;
    }
}
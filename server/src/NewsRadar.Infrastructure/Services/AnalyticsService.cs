using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Infrastructure.Services;

/// <summary>
/// Thuc hien cac nghiep vu phan tich du lieu & Dashboard Analytics.
/// Inject ApplicationDbContext (Scoped) va INlpService (Singleton).
/// </summary>
public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly INlpService _nlpService;

    public AnalyticsService(ApplicationDbContext context, INlpService nlpService)
    {
        _context = context;
        _nlpService = nlpService;
    }

    /// <inheritdoc/>
    public async Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync()
    {
        var articles = await _context.Articles
            .Include(a => a.CrawlerSource)
            .AsNoTracking()
            .ToListAsync();

        // 1. Thong ke Sentiment
        var sentimentStats = new List<SentimentStatDto>
        {
            new() { Sentiment = "Positive", Count = articles.Count(a => a.SentimentLabel == "Positive") },
            new() { Sentiment = "Neutral",  Count = articles.Count(a => a.SentimentLabel == "Neutral")  },
            new() { Sentiment = "Negative", Count = articles.Count(a => a.SentimentLabel == "Negative") },
        };

        // 2. Thong ke Category
        var categoryStats = articles
            .GroupBy(a => a.Category)
            .Select(g => new CategoryStatDto { Category = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToList();

        // 3. Tag Cloud Bigrams tu 24h gan nhat (fallback: 50 bai moi nhat)
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var recentArticles = articles.Where(a => a.PublishedAt >= cutoff).ToList();
        if (recentArticles.Count < 5)
            recentArticles = articles.OrderByDescending(a => a.PublishedAt).Take(50).ToList();

        var wordCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var art in recentArticles)
        {
            foreach (var bigram in _nlpService.ExtractBigrams(art.Title))
                wordCounts[bigram] = wordCounts.GetValueOrDefault(bigram) + 1;
        }

        var hotKeywords = wordCounts
            .Where(kv => kv.Value >= 2)
            .OrderByDescending(kv => kv.Value)
            .Take(20)
            .Select(kv => new HotKeywordDto { Keyword = kv.Key, Count = kv.Value })
            .ToList();

        // 4. Top 5 bai viet Trending
        var topTrending = articles
            .OrderByDescending(a => a.TrendScore)
            .Take(5)
            .Select(a => new ArticleDto
            {
                Id              = a.Id,
                Title           = a.Title,
                Sapo            = a.Sapo,
                Url             = a.Url,
                Category        = a.Category,
                PublishedAt     = a.PublishedAt,
                CrawlerSourceName = a.CrawlerSource?.Name ?? "N/A",
                SentimentLabel  = a.SentimentLabel,
                SentimentScore  = a.SentimentScore,
                TrendScore      = a.TrendScore,
                Author          = a.Author,
                ImageUrl        = a.ImageUrl,
                ClusterId       = a.ClusterId,
                ClusterCount    = a.ClusterCount,
            })
            .ToList();

        return new DashboardAnalyticsDto
        {
            TotalArticles        = articles.Count,
            SentimentStats       = sentimentStats,
            CategoryStats        = categoryStats,
            HotKeywords24h       = hotKeywords,
            TopTrendingArticles  = topTrending,
        };
    }

    /// <inheritdoc/>
    public async Task<int> ReprocessAllArticlesAsync()
    {
        var articles = await _context.Articles.OrderBy(a => a.CrawledAt).ToListAsync();
        var seenHashes = new HashSet<string>();
        var duplicates  = new List<Domain.Entities.Article>();

        foreach (var article in articles)
        {
            var hash = _nlpService.ComputeSha256Hash(article.Title);

            if (seenHashes.Contains(hash))
            {
                duplicates.Add(article);
                continue;
            }

            seenHashes.Add(hash);
            article.ContentHash    = hash;
            var (label, score)     = _nlpService.AnalyzeSentiment(article.Title, article.Sapo);
            article.SentimentLabel = label;
            article.SentimentScore = score;
            article.TrendScore     = _nlpService.CalculateTrendScore(article.Title, article.Sapo, article.PublishedAt);
            article.Category       = _nlpService.DetermineCategory(article.Title, article.Sapo);
        }

        if (duplicates.Count > 0)
            _context.Articles.RemoveRange(duplicates);

        await _context.SaveChangesAsync();
        return articles.Count - duplicates.Count;
    }
}

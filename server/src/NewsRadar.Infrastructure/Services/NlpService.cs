using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Infrastructure.Services;

public class NlpService : INlpService
{
    private readonly ApplicationDbContext _context;

    // Từ điển Sắc thái Tích cực (Positive)
    private static readonly string[] PositiveWords =
    [
        "tăng trưởng", "đột phá", "thành công", "kỷ lục", "khởi sắc", "hỗ trợ",
        "khen thưởng", "an toàn", "thắng lợi", "phục hồi", "tích cực", "hiện đại",
        "giải cứu", "khánh thành", "hợp tác", "vinh danh", "ưu đãi", "phát triển",
        "hạnh phúc", "miễn phí", "chiến thắng", "vượt chỉ tiêu"
    ];

    // Từ điển Sắc thái Tiêu cực (Negative)
    private static readonly string[] NegativeWords =
    [
        "tai nạn", "tử vong", "thiệt hại", "sạt lở", "lừa đảo", "khủng hoảng",
        "suy thoái", "bắt giữ", "khởi tố", "ngập lụt", "cháy", "dịch bệnh",
        "bão", "lũ", "thương vong", "vi phạm", "ô nhiễm", "kẹt xe", "buôn lậu",
        "tham nhũng", "nạn nhân", "cảnh báo", "khẩn cấp", "mất tích", "giảm mạnh"
    ];

    // Từ khóa Tin nóng cộng điểm Trend
    private static readonly string[] HotBoostWords =
    [
        "khẩn", "nóng", "kỷ lục", "đột phá", "bão", "khởi tố", "sạt lở",
        "giá vàng", "chứng khoán", "ai", "bán dẫn", "cao tốc", "sân bay", "chính phủ"
    ];

    // Từ dừng (Stopwords) loại bỏ khi trích xuất Tag Cloud
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "của", "và", "các", "những", "trong", "được", "cho", "với", "không", "người",
        "này", "đã", "đang", "sẽ", "một", "nhiều", "trên", "về", "tại", "theo", "từ",
        "khi", "đến", "vào", "ra", "có", "là", "để", "việc", "sau", "trước", "cùng",
        "như", "do", "vì", "bị", "bởi", "hơn", "nhất", "cũng", "vẫn", "chỉ", "rất"
    };

    public NlpService(ApplicationDbContext context)
    {
        _context = context;
    }

    // 1. Thuật toán băm SHA-256 chuẩn hóa chuỗi
    public string ComputeSha256Hash(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return string.Empty;

        var normalized = Regex.Replace(rawText.Trim().ToLowerInvariant(), @"\s+", " ");
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    // 2. Phân tích Sắc thái (Sentiment Analysis)
    public (string Label, double Score) AnalyzeSentiment(string title, string sapo)
    {
        var fullText = $"{title} {sapo}".ToLowerInvariant();
        int posCount = 0;
        int negCount = 0;

        foreach (var word in PositiveWords)
        {
            if (fullText.Contains(word)) posCount++;
        }

        foreach (var word in NegativeWords)
        {
            if (fullText.Contains(word)) negCount++;
        }

        int diff = posCount - negCount;
        double score = Math.Clamp(diff * 0.25, -1.0, 1.0);

        if (score > 0) return ("Positive", Math.Round(score, 2));
        if (score < 0) return ("Negative", Math.Round(score, 2));
        return ("Neutral", 0);
    }

    // 3. Tính điểm HOT theo thời gian (Time-decay Trend Score)
    public double CalculateTrendScore(string title, string sapo, DateTime publishedAt)
    {
        var fullText = $"{title} {sapo}".ToLowerInvariant();
        double baseWeight = 100.0;

        foreach (var boost in HotBoostWords)
        {
            if (fullText.Contains(boost)) baseWeight += 35.0;
        }

        var hoursSincePublished = Math.Max(0, (DateTime.UtcNow - publishedAt.ToUniversalTime()).TotalHours);
        double gravity = Math.Pow(hoursSincePublished + 2.0, 1.5);
        double trendScore = baseWeight / gravity;

        return Math.Round(trendScore, 2);
    }

    // 4. Quét & Cập nhật NLP + Lọc trùng cho toàn bộ bài viết đã có trong DB
    public async Task<int> ReprocessAllArticlesAsync()
    {
        var articles = await _context.Articles.OrderBy(a => a.CrawledAt).ToListAsync();
        var seenHashes = new HashSet<string>();
        var duplicatesToRemove = new List<NewsRadar.Domain.Entities.Article>();

        foreach (var article in articles)
        {
            var hash = ComputeSha256Hash(article.Title);
            if (seenHashes.Contains(hash))
            {
                duplicatesToRemove.Add(article);
                continue;
            }

            seenHashes.Add(hash);
            article.ContentHash = hash;

            var (label, score) = AnalyzeSentiment(article.Title, article.Sapo);
            article.SentimentLabel = label;
            article.SentimentScore = score;
            article.TrendScore = CalculateTrendScore(article.Title, article.Sapo, article.PublishedAt);
        }

        if (duplicatesToRemove.Count > 0)
        {
            _context.Articles.RemoveRange(duplicatesToRemove);
        }

        await _context.SaveChangesAsync();
        return articles.Count - duplicatesToRemove.Count;
    }

    // 5. Tổng hợp dữ liệu cho Dashboard (Sentiment Chart + Tag Cloud 24h)
    public async Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync()
    {
        var articles = await _context.Articles
            .Include(a => a.CrawlerSource)
            .AsNoTracking()
            .ToListAsync();

        // Thống kê Sentiment
        var sentimentStats = new List<SentimentStatDto>
        {
            new() { Sentiment = "Positive", Count = articles.Count(a => a.SentimentLabel == "Positive") },
            new() { Sentiment = "Neutral",  Count = articles.Count(a => a.SentimentLabel == "Neutral") },
            new() { Sentiment = "Negative", Count = articles.Count(a => a.SentimentLabel == "Negative") }
        };

        // Lấy bài viết trong 24h gần nhất (nếu ít hơn 5 bài thì lấy 50 bài mới nhất để luôn có dữ liệu hiển thị)
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var recentArticles = articles.Where(a => a.PublishedAt >= cutoff).ToList();
        if (recentArticles.Count < 5)
        {
            recentArticles = articles.OrderByDescending(a => a.PublishedAt).Take(50).ToList();
        }

        // Bóc tách cụm từ 2 âm tiết (Bigrams) tạo Tag Cloud từ khóa Hot
        var wordCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var art in recentArticles)
        {
            var cleanTitle = Regex.Replace(art.Title.ToLowerInvariant(), @"[^\p{L}\p{N}\s]", " ");
            var tokens = cleanTitle.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                                   .Where(w => w.Length > 2 && !StopWords.Contains(w))
                                   .ToArray();

            for (int i = 0; i < tokens.Length - 1; i++)
            {
                var bigram = $"{tokens[i]} {tokens[i + 1]}";
                wordCounts[bigram] = wordCounts.GetValueOrDefault(bigram) + 1;
            }
        }

        var hotKeywords = wordCounts
            .Where(kv => kv.Value >= 2)
            .OrderByDescending(kv => kv.Value)
            .Take(20)
            .Select(kv => new HotKeywordDto { Keyword = kv.Key, Count = kv.Value })
            .ToList();

        var topTrending = articles
            .OrderByDescending(a => a.TrendScore)
            .Take(5)
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                Title = a.Title,
                Sapo = a.Sapo,
                Url = a.Url,
                PublishedAt = a.PublishedAt,
                CrawlerSourceName = a.CrawlerSource != null ? a.CrawlerSource.Name : "N/A",
                SentimentLabel = a.SentimentLabel,
                SentimentScore = a.SentimentScore,
                TrendScore = a.TrendScore
            })
            .ToList();

        return new DashboardAnalyticsDto
        {
            TotalArticles = articles.Count,
            SentimentStats = sentimentStats,
            HotKeywords24h = hotKeywords,
            TopTrendingArticles = topTrending
        };
    }
}
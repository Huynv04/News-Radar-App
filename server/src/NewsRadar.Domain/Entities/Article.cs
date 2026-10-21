namespace NewsRadar.Domain.Entities;

public class Article
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Sapo { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string Url { get; set; } = string.Empty;

    // Chuỗi Hash SHA-256 của URL để đánh Index tìm kiếm & lọc trùng bài viết cực nhanh
    public string UrlHash { get; set; } = string.Empty;

    public DateTime PublishedAt { get; set; }
    public DateTime CrawledAt { get; set; } = DateTime.UtcNow;

    // Khoá ngoại liên kết tới CrawlerSource ở Module 1
    public string CrawlerSourceId { get; set; } = string.Empty;
    public CrawlerSource? CrawlerSource { get; set; }

    // --- BỔ SUNG CHO MODULE 4 (NLP & DEDUPLICATION) ---
    public string ContentHash { get; set; } = string.Empty;
    public string SentimentLabel { get; set; } = "Neutral"; // Positive | Negative | Neutral
    public double SentimentScore { get; set; } = 0;
    public double TrendScore { get; set; } = 0;
    public string Category { get; set; } = "Thời sự";
    // Ghim bài viết quan trọng lên đầu trang (Editorial Pinning)
    public bool IsPinned { get; set; } = false;

}
namespace NewsRadar.Domain.Entities;

public class Article
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = null!;
    public string? Sapo { get; set; }
    public string CleanBody { get; set; } = null!;
    public string SourceUrl { get; set; } = null!;
    public string SourceId { get; set; } = null!;
    public string? Author { get; set; }
    public DateTime PublishedAt { get; set; }
    public string HashKey { get; set; } = null!; // SHA-256 Deduplication
    public string Category { get; set; } = null!;
    public double SentimentScore { get; set; }
    public string SentimentLabel { get; set; } = null!;
    public double TrendScore { get; set; } = 0.0;
    public bool IsManuallyOverridden { get; set; } = false;
    public DateTime? PinnedUntil { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public CrawlerSource? Source { get; set; }
}
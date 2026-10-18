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
}
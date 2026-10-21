namespace NewsRadar.Application.Common.DTOs;

public class ArticleDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Sapo { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string Url { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public DateTime CrawledAt { get; set; }
    public string CrawlerSourceId { get; set; } = string.Empty;
    public string CrawlerSourceName { get; set; } = string.Empty;

    // Bổ sung Module 4
    public string ContentHash { get; set; } = string.Empty;
    public string SentimentLabel { get; set; } = "Neutral";
    public double SentimentScore { get; set; }
    public double TrendScore { get; set; }
    public string Category { get; set; } = "Thời sự";
    public bool IsPinned { get; set; }
}

public class ArticleFilterParams
{
    public string? SourceId { get; set; }
    public string? SearchKeyword { get; set; }
    public string? Sentiment { get; set; } // Lọc theo: Positive, Negative, Neutral
    public string? Category { get; set; } // Lọc theo Danh mục
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    // Con trỏ (Cursor) phục vụ Keyset Pagination
    public DateTime? LastPublishedAt { get; set; }
    public Guid? LastId { get; set; }
    public int PageSize { get; set; } = 20;
}

public class CursorPagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public DateTime? NextLastPublishedAt { get; set; }
    public Guid? NextLastId { get; set; }
    public bool HasNextPage { get; set; }
}
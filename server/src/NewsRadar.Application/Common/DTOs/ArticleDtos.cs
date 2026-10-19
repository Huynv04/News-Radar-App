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
}

public class ArticleFilterParams
{
    public string? SourceId { get; set; }
    public string? SearchKeyword { get; set; }
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
namespace NewsRadar.Application.Common.DTOs;

public class CrawlerLogDto
{
    public Guid Id { get; set; }
    public string CrawlerSourceId { get; set; } = string.Empty;
    public DateTime ScannedAt { get; set; }
    public int ArticlesFound { get; set; }
    public int ArticlesInserted { get; set; }
    public long DurationMs { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public int? HttpStatusCode { get; set; }
}

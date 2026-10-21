namespace NewsRadar.Application.Common.DTOs;

public class CrawlerSourceDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string RssUrl { get; set; } = null!;
    public string BaseUrl { get; set; } = null!;
    public bool IsActive { get; set; }
    public int ScanIntervalMinutes { get; set; }
    public string Selectors { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int ConsecutiveFailures { get; set; }
public DateTime? LastScannedAt { get; set; }

}
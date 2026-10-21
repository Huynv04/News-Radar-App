namespace NewsRadar.Domain.Entities;

public class CrawlerLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CrawlerSourceId { get; set; } = null!;
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
    
    public int ArticlesFound { get; set; }        // Số bài đọc được từ RSS
    public int ArticlesInserted { get; set; }     // Số bài mới thực sự lưu vào DB
    public long DurationMs { get; set; }          // Thời gian cào (ms)
    public bool IsSuccess { get; set; }           // Cào thành công hay lỗi
    public string? ErrorMessage { get; set; }     // Nội dung lỗi nếu có
    public int? HttpStatusCode { get; set; }      // Mã lỗi HTTP (404, 500, 503...)

    // Navigation property
    public CrawlerSource CrawlerSource { get; set; } = null!;
}

namespace NewsRadar.Domain.Entities;

public class CrawlerSource
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string RssUrl { get; set; } = null!;
    public string BaseUrl { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public int ScanIntervalMinutes { get; set; } = 10;
    public string Selectors { get; set; } = null!; // Cấu hình XPath/CSS dạng JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
// === BỔ SUNG CHO CIRCUIT BREAKER & GIÁM SÁT ===
    public int ConsecutiveFailures { get; set; } = 0;   // Đếm lỗi liên tiếp
    public DateTime? LastScannedAt { get; set; }         // Lần quét gần nhất
    // Navigation properties
    public ICollection<Article> Articles { get; set; } = new List<Article>();
    public ICollection<CrawlerLog> Logs { get; set; } = new List<CrawlerLog>();
}
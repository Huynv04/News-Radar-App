namespace NewsRadar.Domain.Entities;

/// <summary>
/// Đăng ký nhận thông báo theo từ khóa hoặc danh mục.
/// Kênh nhận: Email hoặc In-App (SignalR).
/// </summary>
public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    /// <summary>Từ khóa quan tâm (VD: "AI", "chứng khoán", "bóng đá")</summary>
    public string Keyword { get; set; } = string.Empty;

    /// <summary>Danh mục tùy chọn để lọc thêm (VD: "Công nghệ")</summary>
    public string? Category { get; set; }

    /// <summary>Kênh thông báo: "Email" | "InApp"</summary>
    public string Channel { get; set; } = "InApp";

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

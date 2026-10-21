namespace NewsRadar.Domain.Entities;

/// <summary>
/// Người dùng hệ thống. Hỗ trợ cả đăng ký Email/Password và Google OAuth2.
/// </summary>
public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Đối với tài khoản Email/Password: lưu hash bcrypt
    public string? PasswordHash { get; set; }

    // Đối với tài khoản Google OAuth2: lưu Google sub (unique user ID)
    public string? GoogleId { get; set; }

    // Avatar URL (từ Google profile hoặc gravatar)
    public string? AvatarUrl { get; set; }

    // Role: "User" | "Admin"
    public string Role { get; set; } = "User";

    // Refresh token cho JWT rotation
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}

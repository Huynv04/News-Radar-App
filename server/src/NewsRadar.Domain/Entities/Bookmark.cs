namespace NewsRadar.Domain.Entities;

/// <summary>
/// Bài viết được người dùng lưu vào bookmark.
/// </summary>
public class Bookmark
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public Guid ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}

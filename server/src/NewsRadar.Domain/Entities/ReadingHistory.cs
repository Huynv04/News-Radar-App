namespace NewsRadar.Domain.Entities;

public class ReadingHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public Guid ArticleId { get; set; }
    public Article Article { get; set; } = null!;

    public DateTime ReadAt { get; set; } = DateTime.UtcNow;
}

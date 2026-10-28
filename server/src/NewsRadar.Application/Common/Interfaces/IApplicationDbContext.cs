using Microsoft.EntityFrameworkCore;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<CrawlerSource> CrawlerSources { get; }
    DbSet<Article> Articles { get; }
    DbSet<CrawlerLog> CrawlerLogs { get; }

    // ── Module 6 ──────────────────────────────────────────────────────────────
    DbSet<AppUser> AppUsers { get; }
    DbSet<Bookmark> Bookmarks { get; }
    DbSet<Subscription> Subscriptions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

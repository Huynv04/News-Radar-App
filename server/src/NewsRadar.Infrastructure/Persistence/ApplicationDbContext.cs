using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<CrawlerSource> CrawlerSources => Set<CrawlerSource>();
    public DbSet<Article> Articles => Set<Article>();

    // ── Module 6: Personalization ─────────────────────────────────────────────
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<ReadingHistory> ReadingHistories => Set<ReadingHistory>();
    public DbSet<CrawlerLog> CrawlerLogs => Set<CrawlerLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình bảng CrawlerSource
        modelBuilder.Entity<CrawlerSource>(builder =>
        {
            builder.ToTable("crawler_sources");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Selectors).HasColumnType("jsonb");
            builder.Property(s => s.ConsecutiveFailures).HasDefaultValue(0);
        });

        // Cấu hình Unique Index cho UrlHash để đảm bảo không bị ghi trùng bài viết ở tầng DB
        modelBuilder.Entity<Article>(entity =>
        {
            entity.ToTable("articles");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UrlHash).IsUnique();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Url).IsRequired();

            entity.Property(e => e.Category).HasMaxLength(100).HasDefaultValue("Thời sự");
            entity.HasIndex(e => e.PublishedAt);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.TrendScore);
            entity.Property(e => e.IsPinned).HasDefaultValue(false);
            entity.HasIndex(e => e.IsPinned);
            entity.HasIndex(e => e.ClusterId);
            entity.Property(e => e.Author).HasMaxLength(200);
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.ClusterCount).HasDefaultValue(1);


            // Khai báo chính xác khóa ngoại CrawlerSourceId
            entity.HasOne(e => e.CrawlerSource)
                  .WithMany(s => s.Articles)
                  .HasForeignKey(e => e.CrawlerSourceId)
                  .IsRequired()
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── AppUser ───────────────────────────────────────────────────────────
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("app_users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.GoogleId).HasMaxLength(256);
            entity.HasIndex(e => e.GoogleId);
            entity.Property(e => e.GitHubId).HasMaxLength(256);
            entity.HasIndex(e => e.GitHubId);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Role).HasMaxLength(20).HasDefaultValue("User");
        });

        // ── Bookmark ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Bookmark>(entity =>
        {
            entity.ToTable("bookmarks");
            entity.HasKey(e => e.Id);
            // Unique: mỗi user chỉ bookmark 1 bài 1 lần
            entity.HasIndex(e => new { e.UserId, e.ArticleId }).IsUnique();

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Bookmarks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Article)
                  .WithMany()
                  .HasForeignKey(e => e.ArticleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Subscription ──────────────────────────────────────────────────────
        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("subscriptions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Keyword).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Channel).HasMaxLength(20).HasDefaultValue("InApp");
            entity.HasIndex(e => e.Keyword);
            entity.HasIndex(e => e.UserId);

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Subscriptions)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ReadingHistory ────────────────────────────────────────────────────
modelBuilder.Entity<ReadingHistory>(entity =>
{
    entity.ToTable("reading_histories");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => new { e.UserId, e.ArticleId });
    entity.HasIndex(e => e.ReadAt);

    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);

    entity.HasOne(e => e.Article)
          .WithMany()
          .HasForeignKey(e => e.ArticleId)
          .OnDelete(DeleteBehavior.Cascade);
});
// ── Cấu hình bảng CrawlerLog & Circuit Breaker ────────────────────────
modelBuilder.Entity<CrawlerLog>(entity =>
{
    entity.ToTable("crawler_logs");
    entity.HasKey(e => e.Id);
    entity.HasIndex(e => e.CrawlerSourceId);
    entity.HasIndex(e => e.ScannedAt);

    entity.HasOne(e => e.CrawlerSource)
          .WithMany(s => s.Logs)
          .HasForeignKey(e => e.CrawlerSourceId)
          .OnDelete(DeleteBehavior.Cascade);
});


    }
}
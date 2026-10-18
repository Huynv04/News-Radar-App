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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình bảng CrawlerSource
        modelBuilder.Entity<CrawlerSource>(builder =>
        {
            builder.ToTable("crawler_sources");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Selectors).HasColumnType("jsonb");
        });
        // Cấu hình Unique Index cho UrlHash để đảm bảo không bị ghi trùng bài viết ở tầng DB
        modelBuilder.Entity<Article>(entity =>
      {
          entity.ToTable("articles");
          entity.HasKey(e => e.Id);
          entity.HasIndex(e => e.UrlHash).IsUnique();
          entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
          entity.Property(e => e.Url).IsRequired();

          // Khai báo chính xác khóa ngoại CrawlerSourceId
          entity.HasOne(e => e.CrawlerSource)
                .WithMany(s => s.Articles) // <-- Đã bổ sung s.Articles
                .HasForeignKey(e => e.CrawlerSourceId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
      });

    }
}
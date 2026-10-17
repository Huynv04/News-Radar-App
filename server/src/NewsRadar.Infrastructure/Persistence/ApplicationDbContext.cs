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

        // Cấu hình bảng Article
        modelBuilder.Entity<Article>(builder =>
        {
            builder.ToTable("articles");
            builder.HasKey(a => a.Id);
            builder.HasIndex(a => a.SourceUrl).IsUnique();
            builder.HasIndex(a => a.HashKey).IsUnique();

            // Index tối ưu Cursor-based Pagination
            builder.HasIndex(a => new { a.PublishedAt, a.Id });

            builder.HasOne(a => a.Source)
                   .WithMany(s => s.Articles)
                   .HasForeignKey(a => a.SourceId)
                   .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
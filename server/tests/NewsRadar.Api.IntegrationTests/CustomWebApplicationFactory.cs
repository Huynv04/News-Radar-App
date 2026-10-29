using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;
using NewsRadar.Infrastructure.BackgroundServices;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Api.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "InMemoryTestDb_" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("UseInMemoryDatabase", "true");
        builder.UseSetting("InMemoryDbName", _dbName);

        builder.ConfigureServices(services =>
        {
            // Gỡ bỏ CrawlerBackgroundService để không quét cào tin ngầm khi đang chạy test
            var crawlerWorkers = services.Where(d => d.ImplementationType == typeof(CrawlerBackgroundService)).ToList();
            foreach (var worker in crawlerWorkers)
            {
                services.Remove(worker);
            }

            // Seed dữ liệu mẫu vào InMemory Database
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
            SeedTestData(db);
        });
    }

    private static void SeedTestData(ApplicationDbContext db)
    {
        // 1. Seed CrawlerSource mẫu
        if (!db.CrawlerSources.Any(s => s.Id == "test-source"))
        {
            db.CrawlerSources.Add(new CrawlerSource
            {
                Id = "test-source",
                Name = "Test News Source",
                RssUrl = "https://example.com/rss.xml",
                BaseUrl = "https://example.com",
                IsActive = true,
                ScanIntervalMinutes = 15,
                Selectors = "{\"content\":\"//article\"}"
            });
        }

        // 2. Seed Articles mẫu (để test Search, Cursor Pagination, Pin, Override)
        var article1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
        if (!db.Articles.Any(a => a.Id == article1))
        {
            db.Articles.Add(new Article
            {
                Id = article1,
                Title = "AI Đột phá mạnh mẽ trong công nghệ 2026",
                Sapo = "Trí tuệ nhân tạo đang thay đổi toàn bộ thị trường công nghệ.",
                Url = "https://example.com/ai-breakthrough",
                UrlHash = "hash-123456",
                Category = "Công nghệ",
                SentimentLabel = "Positive",
                SentimentScore = 0.85,
                TrendScore = 75.0,
                PublishedAt = DateTime.UtcNow.AddHours(-1),
                CrawledAt = DateTime.UtcNow,
                CrawlerSourceId = "test-source",
                IsPinned = false,
                ClusterCount = 1
            });
        }

        var article2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        if (!db.Articles.Any(a => a.Id == article2))
        {
            db.Articles.Add(new Article
            {
                Id = article2,
                Title = "Thị trường bất động sản ghi nhận tín hiệu phục hồi",
                Sapo = "Phân khúc nhà ở xã hội và căn hộ chung cư đón nhận dòng tiền mới.",
                Url = "https://example.com/bds-hoi-phuc",
                UrlHash = "hash-654321",
                Category = "Kinh tế",
                SentimentLabel = "Neutral",
                SentimentScore = 0.5,
                TrendScore = 40.0,
                PublishedAt = DateTime.UtcNow.AddHours(-2),
                CrawledAt = DateTime.UtcNow,
                CrawlerSourceId = "test-source",
                IsPinned = false,
                ClusterCount = 1
            });
        }

        var article3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        if (!db.Articles.Any(a => a.Id == article3))
        {
            db.Articles.Add(new Article
            {
                Id = article3,
                Title = "Cảnh báo khẩn: Bão số 5 diễn biến phức tạp",
                Sapo = "Mưa to diện rộng trên toàn khu vực miền Trung trong 24 giờ tới.",
                Url = "https://example.com/bao-so-5",
                UrlHash = "hash-789012",
                Category = "Thời sự",
                SentimentLabel = "Negative",
                SentimentScore = -0.7,
                TrendScore = 90.0,
                PublishedAt = DateTime.UtcNow.AddHours(-3),
                CrawledAt = DateTime.UtcNow,
                CrawlerSourceId = "test-source",
                IsPinned = false,
                ClusterCount = 2
            });
        }

        // 3. Seed CrawlerLog mẫu
        if (!db.CrawlerLogs.Any())
        {
            db.CrawlerLogs.Add(new CrawlerLog
            {
                Id = Guid.NewGuid(),
                CrawlerSourceId = "test-source",
                ScannedAt = DateTime.UtcNow,
                IsSuccess = true,
                ArticlesFound = 10,
                ArticlesInserted = 5,
                DurationMs = 250
            });
        }

        db.SaveChanges();
    }

    /// <summary>
    /// Tạo HttpClient kèm JWT Bearer Token theo Role (User / Admin) và lưu user vào DB.
    /// </summary>
    public HttpClient CreateAuthenticatedClient(string role = "User", Guid? userId = null, string? email = null)
    {
        var client = CreateClient();
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var jwtService = scope.ServiceProvider.GetRequiredService<IJwtService>();

        var uid = userId ?? Guid.NewGuid();
        var mail = email ?? $"user_{Guid.NewGuid():N}@newsradar.test";

        var user = db.AppUsers.Find(uid);
        if (user == null)
        {
            user = new AppUser
            {
                Id = uid,
                Email = mail,
                DisplayName = role == "Admin" ? "Test Admin" : "Test User",
                Role = role
            };
            db.AppUsers.Add(user);
            db.SaveChanges();
        }

        var token = jwtService.GenerateAccessToken(user);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        return client;
    }
}

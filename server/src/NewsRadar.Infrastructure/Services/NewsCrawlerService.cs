using System.Security.Cryptography;
using System.Text;
using CodeHollow.FeedReader;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using NewsRadar.Domain.Entities;
using NewsRadar.Infrastructure.Persistence;

namespace NewsRadar.Infrastructure.Services;

public class NewsCrawlerService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly HttpClient _httpClient;

    public NewsCrawlerService(ApplicationDbContext dbContext, HttpClient httpClient)
    {
        _dbContext = dbContext;
        _httpClient = httpClient;
    }

    // Hàm tạo mã Hash SHA-256 từ URL
    public static string GenerateSha256Hash(string rawData)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawData.Trim().ToLower()));
        return Convert.ToHexString(bytes);
    }

    public async Task CrawlSourceAsync(CrawlerSource source, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Đọc RSS Feed từ URL của nguồn
            var feed = await FeedReader.ReadAsync(source.RssUrl, cancellationToken);
            if (feed == null || !feed.Items.Any()) return;

            foreach (var item in feed.Items)
            {
                if (cancellationToken.IsCancellationRequested) break;

                string articleUrl = item.Link;
                if (string.IsNullOrEmpty(articleUrl)) continue;

                string urlHash = GenerateSha256Hash(articleUrl);

                // 2. Kiểm tra xem bài viết đã có trong Database chưa bằng UrlHash
                bool isExisted = await _dbContext.Articles.AnyAsync(a => a.UrlHash == urlHash, cancellationToken);
                if (isExisted) continue; // Nếu đã cào rồi thì bỏ qua

                // 3. Cào nội dung chi tiết bài viết (HTML Scraping)
                string fullContent = await ScrapeArticleContentAsync(articleUrl, source.Selectors, cancellationToken);

                // 4. Khởi tạo Entity Article
                var article = new Article
                {
                    Title = item.Title ?? "Khong co tieu de",
                    Sapo = item.Description ?? string.Empty,
                    Content = fullContent,
                    Url = articleUrl,
                    UrlHash = urlHash,
                    PublishedAt = item.PublishingDate?.ToUniversalTime() ?? DateTime.UtcNow,
                    CrawledAt = DateTime.UtcNow,
                    CrawlerSourceId = source.Id
                };

                _dbContext.Articles.Add(article);
            }

            // 5. Lưu toàn bộ bài viết mới cào được vào PostgreSQL
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Crawler Error] Lỗi cào nguồn {source.Name}: {ex.Message}");
        }
    }

    private async Task<string> ScrapeArticleContentAsync(string url, string selectorsJson, CancellationToken cancellationToken)
    {
        try
        {
            var html = await _httpClient.GetStringAsync(url, cancellationToken);
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Mặc định bóc tách theo class phổ biến hoặc selector cấu hình
            var bodyNode = doc.DocumentNode.SelectSingleNode("//article")
                        ?? doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'content')]");

            return bodyNode != null ? bodyNode.InnerText.Trim() : string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}
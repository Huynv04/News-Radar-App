using System.Diagnostics;
using System.Text.RegularExpressions;
using CodeHollow.FeedReader;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;
using MediatR;
using NewsRadar.Application.Common.Events;

namespace NewsRadar.Infrastructure.Services;

public class NewsCrawlerService
{
    private readonly IArticleService           _articleService;
    private readonly INlpService               _nlpService;
    private readonly HttpClient                _httpClient;
    private readonly ISubscriptionService      _subscriptionService;
    private readonly IEmailNotificationService _emailService;
    private readonly IMediator                 _mediator;
    private readonly IApplicationDbContext     _dbContext;

    public NewsCrawlerService(
        IArticleService           articleService,
        INlpService               nlpService,
        HttpClient                httpClient,
        ISubscriptionService      subscriptionService,
        IEmailNotificationService emailService,
        IMediator                 mediator,
        IApplicationDbContext     dbContext)
    {
        _articleService      = articleService;
        _nlpService          = nlpService;
        _httpClient          = httpClient;
        _subscriptionService = subscriptionService;
        _emailService        = emailService;
        _mediator            = mediator;
        _dbContext           = dbContext;
    }

    public async Task CrawlSourceAsync(CrawlerSource source, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();
        int articlesFound = 0;
        int articlesInserted = 0;
        bool isSuccess = false;
        string? errorMessage = null;
        int? httpStatusCode = null;

        try
        {
            var feed = await FeedReader.ReadAsync(source.RssUrl, cancellationToken);
            if (feed != null && feed.Items.Any())
            {
                articlesFound = feed.Items.Count;

                // Chuẩn bị danh sách các bài viết gần đây (trong 48h) phục vụ Cosine Similarity gom nhóm sự kiện
                var recentCutoff = DateTime.UtcNow.AddHours(-48);
                var recentArticles = await _dbContext.Articles
                    .Where(a => a.PublishedAt >= recentCutoff)
                    .OrderByDescending(a => a.PublishedAt)
                    .Take(80)
                    .ToListAsync(cancellationToken);

                foreach (var item in feed.Items)
                {
                    if (cancellationToken.IsCancellationRequested) break;

                    var articleUrl = item.Link;
                    if (string.IsNullOrWhiteSpace(articleUrl)) continue;

                    // 1. Deduplication qua SHA-256 URL Hash
                    var urlHash = _nlpService.ComputeSha256Hash(articleUrl);
                    if (await _articleService.ArticleExistsAsync(urlHash, cancellationToken)) continue;

                    // 2. HTML Web Scraping (Content, Sapo, Author, Image)
                    var scrapedData = await ScrapeArticleContentAsync(articleUrl, source.Selectors, item.Description, item.Author, cancellationToken);

                    var title       = item.Title?.Trim() ?? "Không có tiêu đề";
                    var sapo        = item.Description?.Trim() ?? string.Empty;
                    var publishedAt = item.PublishingDate?.ToUniversalTime() ?? DateTime.UtcNow;

                    // 3. Cosine Similarity & Đa nguồn cùng đưa tin (Event Clustering)
                    Guid? clusterId = null;
                    int clusterCount = 1;
                    var currentText = $"{title} {sapo}";

                    Article? matchedArticle = null;
                    foreach (var pastArticle in recentArticles)
                    {
                        var pastText = $"{pastArticle.Title} {pastArticle.Sapo}";
                        var similarity = _nlpService.CalculateCosineSimilarity(currentText, pastText);

                        // Ngưỡng 0.52 xác nhận 2 bài viết từ nhiều báo cùng đưa tin về 1 sự kiện
                        if (similarity >= 0.52)
                        {
                            matchedArticle = pastArticle;
                            break;
                        }
                    }

                    if (matchedArticle != null)
                    {
                        clusterId = matchedArticle.ClusterId ?? Guid.NewGuid();
                        if (!matchedArticle.ClusterId.HasValue)
                        {
                            matchedArticle.ClusterId = clusterId;
                        }

                        matchedArticle.ClusterCount++;
                        clusterCount = matchedArticle.ClusterCount;

                        // Đồng bộ số lượng báo cùng đưa tin cho các bài viết trong cùng cụm
                        foreach (var sibling in recentArticles.Where(a => a.ClusterId == clusterId && a.Id != matchedArticle.Id))
                        {
                            sibling.ClusterCount = clusterCount;
                        }
                    }

                    // 4. NLP Pipeline
                    var contentHash                      = _nlpService.ComputeSha256Hash(title);
                    var (sentimentLabel, sentimentScore) = _nlpService.AnalyzeSentiment(title, sapo);
                    var trendScore                       = _nlpService.CalculateTrendScore(title, sapo, publishedAt, clusterCount);
                    var category                         = _nlpService.DetermineCategory(title, sapo);

                    var article = new Article
                    {
                        Title           = title,
                        Sapo            = sapo,
                        Content         = scrapedData.Content,
                        Url             = articleUrl,
                        UrlHash         = urlHash,
                        PublishedAt     = publishedAt,
                        CrawledAt       = DateTime.UtcNow,
                        CrawlerSourceId = source.Id,
                        ContentHash     = contentHash,
                        SentimentLabel  = sentimentLabel,
                        SentimentScore  = sentimentScore,
                        TrendScore      = trendScore,
                        Category        = category,
                        Author          = scrapedData.Author,
                        ImageUrl        = scrapedData.ImageUrl,
                        ClusterId       = clusterId,
                        ClusterCount    = clusterCount,
                    };

                    // 5. Lưu bài viết & Broadcast Real-time
                    await _articleService.ProcessAndBroadcastArticleAsync(article, cancellationToken);
                    articlesInserted++;
                    recentArticles.Insert(0, article);

                    // 6. Thông báo từ khóa đã theo dõi (In-App SignalR & Email)
                    try
                    {
                        var textToMatch = $"{article.Title} {article.Sapo}";
                        var matchedSubscribers = await _subscriptionService.GetActiveSubscribersForKeywordAsync(textToMatch, cancellationToken);

                        foreach (var sub in matchedSubscribers)
                        {
                            if (sub.Channel == "InApp")
                            {
                                await _mediator.Publish(new KeywordArticleMatchedEvent
                                {
                                    UserId       = sub.UserId,
                                    Keyword      = sub.Keyword,
                                    ArticleId    = article.Id,
                                    ArticleTitle = article.Title,
                                    ArticleUrl   = article.Url,
                                    SourceName   = source.Name,
                                    PublishedAt  = article.PublishedAt,
                                }, cancellationToken);
                            }
                            else if (sub.Channel == "Email")
                            {
                                await _emailService.SendKeywordAlertEmailAsync(
                                    sub.Email,
                                    sub.DisplayName,
                                    sub.Keyword,
                                    article.Title,
                                    article.Url,
                                    source.Name,
                                    cancellationToken);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Subscription Match Error]: {ex.Message}");
                    }
                }
            }

            // Cào thành công -> Reset số lần lỗi liên tiếp
            isSuccess = true;
            source.ConsecutiveFailures = 0;
        }
        catch (HttpRequestException httpEx)
        {
            isSuccess = false;
            errorMessage = httpEx.Message;
            httpStatusCode = (int?)httpEx.StatusCode;
            source.ConsecutiveFailures++;
            Console.WriteLine($"[Crawler HTTP Error] {source.Name} (Status: {httpStatusCode}): {httpEx.Message}");
        }
        catch (Exception ex)
        {
            isSuccess = false;
            errorMessage = ex.Message;
            source.ConsecutiveFailures++;
            Console.WriteLine($"[Crawler Error] {source.Name}: {ex.Message}");
        }
        finally
        {
            sw.Stop();
            source.LastScannedAt = DateTime.UtcNow;

            // === KIỂM TRA CIRCUIT BREAKER ===
            if (!isSuccess && source.ConsecutiveFailures >= 5)
            {
                source.IsActive = false; // Ngắt mạch nguồn cào!

                await _mediator.Publish(new CrawlerCircuitBreakerEvent
                {
                    SourceId            = source.Id,
                    SourceName          = source.Name,
                    ConsecutiveFailures = source.ConsecutiveFailures,
                    Reason              = $"Nguồn '{source.Name}' gặp lỗi liên tiếp 5 lần ({errorMessage}). Hệ thống đã tự động ngắt mạch (Circuit Breaker)!",
                    TriggeredAt         = DateTime.UtcNow
                }, cancellationToken);

                Console.WriteLine($"⚡ [CIRCUIT BREAKER] Đã tự động tắt nguồn cào '{source.Name}' do lỗi liên tiếp 5 lần.");
            }

            // Ghi nhật ký vào bảng crawler_logs
            var log = new CrawlerLog
            {
                Id               = Guid.NewGuid(),
                CrawlerSourceId  = source.Id,
                ScannedAt        = DateTime.UtcNow,
                ArticlesFound    = articlesFound,
                ArticlesInserted = articlesInserted,
                DurationMs       = sw.ElapsedMilliseconds,
                IsSuccess        = isSuccess,
                ErrorMessage     = errorMessage,
                HttpStatusCode   = httpStatusCode
            };

            _dbContext.CrawlerLogs.Add(log);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<(string Content, string? ImageUrl, string? Author)> ScrapeArticleContentAsync(
        string url, string selectorsJson, string? description, string? rssAuthor, CancellationToken cancellationToken)
    {
        string content = string.Empty;
        string? imageUrl = null;
        string? author = !string.IsNullOrWhiteSpace(rssAuthor) ? rssAuthor.Trim() : null;

        // Trích xuất ảnh nhanh từ description RSS nếu có thẻ <img src="...">
        if (!string.IsNullOrWhiteSpace(description))
        {
            var match = Regex.Match(description, "<img[^>]+src=[\"']([^\"']+)[\"']", RegexOptions.IgnoreCase);
            if (match.Success)
            {
                imageUrl = match.Groups[1].Value;
            }
        }

        try
        {
            var html = await _httpClient.GetStringAsync(url, cancellationToken);
            var doc  = new HtmlDocument();
            doc.LoadHtml(html);

            HtmlNode? bodyNode = null;
            if (!string.IsNullOrWhiteSpace(selectorsJson))
            {
                try
                {
                    using var jsonDoc = System.Text.Json.JsonDocument.Parse(selectorsJson);
                    if (jsonDoc.RootElement.TryGetProperty("content", out var contentProp))
                    {
                        var xpath = contentProp.GetString();
                        if (!string.IsNullOrWhiteSpace(xpath))
                        {
                            bodyNode = doc.DocumentNode.SelectSingleNode(xpath);
                        }
                    }

                    if (string.IsNullOrWhiteSpace(imageUrl) && jsonDoc.RootElement.TryGetProperty("image", out var imgProp))
                    {
                        var imgXpath = imgProp.GetString();
                        if (!string.IsNullOrWhiteSpace(imgXpath))
                        {
                            imageUrl = doc.DocumentNode.SelectSingleNode(imgXpath)?.GetAttributeValue("src", null);
                        }
                    }

                    if (string.IsNullOrWhiteSpace(author) && jsonDoc.RootElement.TryGetProperty("author", out var authProp))
                    {
                        var authXpath = authProp.GetString();
                        if (!string.IsNullOrWhiteSpace(authXpath))
                        {
                            author = doc.DocumentNode.SelectSingleNode(authXpath)?.InnerText?.Trim();
                        }
                    }
                }
                catch { }
            }

            bodyNode ??= doc.DocumentNode.SelectSingleNode("//article") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'article-body')]") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'fck_detail')]") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'content')]");


            // Đổi thành giải mã HTML entities:
            var rawContent = bodyNode?.InnerText.Trim() ?? string.Empty;
            content = System.Net.WebUtility.HtmlDecode(rawContent);
            
            // Nếu chưa có ảnh, bóc từ OpenGraph og:image hoặc twitter:image
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                imageUrl = doc.DocumentNode.SelectSingleNode("//meta[@property='og:image']")?.GetAttributeValue("content", null) ??
                           doc.DocumentNode.SelectSingleNode("//meta[@name='twitter:image']")?.GetAttributeValue("content", null);
            }

            // Nếu chưa có tác giả, bóc từ OpenGraph hoặc meta tag author
            if (string.IsNullOrWhiteSpace(author))
            {
                author = doc.DocumentNode.SelectSingleNode("//meta[@name='author']")?.GetAttributeValue("content", null) ??
                         doc.DocumentNode.SelectSingleNode("//span[contains(@class,'author')]")?.InnerText?.Trim() ??
                         doc.DocumentNode.SelectSingleNode("//p[contains(@class,'author')]")?.InnerText?.Trim();
            }

            return (content, imageUrl, author);
        }
        catch
        {
            return (string.Empty, imageUrl, author);
        }
    }
}

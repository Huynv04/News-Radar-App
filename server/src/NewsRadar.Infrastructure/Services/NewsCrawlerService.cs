using System.Diagnostics;
using CodeHollow.FeedReader;
using HtmlAgilityPack;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;
using MediatR;
using NewsRadar.Application.Common.Events;

namespace NewsRadar.Infrastructure.Services;

public class NewsCrawlerService
{
    private readonly IArticleService      _articleService;
    private readonly INlpService          _nlpService;
    private readonly HttpClient           _httpClient;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IMediator            _mediator;
    private readonly IApplicationDbContext _dbContext;

    public NewsCrawlerService(
        IArticleService      articleService,
        INlpService          nlpService,
        HttpClient           httpClient,
        ISubscriptionService subscriptionService,
        IMediator            mediator,
        IApplicationDbContext dbContext)
    {
        _articleService      = articleService;
        _nlpService          = nlpService;
        _httpClient          = httpClient;
        _subscriptionService = subscriptionService;
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

                foreach (var item in feed.Items)
                {
                    if (cancellationToken.IsCancellationRequested) break;

                    var articleUrl = item.Link;
                    if (string.IsNullOrWhiteSpace(articleUrl)) continue;

                    // 1. Deduplication
                    var urlHash = _nlpService.ComputeSha256Hash(articleUrl);
                    if (await _articleService.ArticleExistsAsync(urlHash, cancellationToken)) continue;

                    // 2. HTML Scraping
                    var fullContent = await ScrapeArticleContentAsync(articleUrl, source.Selectors, cancellationToken);

                    var title       = item.Title?.Trim() ?? "Khong co tieu de";
                    var sapo        = item.Description?.Trim() ?? string.Empty;
                    var publishedAt = item.PublishingDate?.ToUniversalTime() ?? DateTime.UtcNow;

                    // 3. NLP Pipeline
                    var contentHash                      = _nlpService.ComputeSha256Hash(title);
                    var (sentimentLabel, sentimentScore) = _nlpService.AnalyzeSentiment(title, sapo);
                    var trendScore                       = _nlpService.CalculateTrendScore(title, sapo, publishedAt);
                    var category                         = _nlpService.DetermineCategory(title, sapo);

                    var article = new Article
                    {
                        Title           = title,
                        Sapo            = sapo,
                        Content         = fullContent,
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
                    };

                    // 4. Luu bai viet
                    await _articleService.ProcessAndBroadcastArticleAsync(article, cancellationToken);
                    articlesInserted++;

                    // 5. Thong bao tu khoa da theo doi
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
                    SourceId = source.Id,
                    SourceName = source.Name,
                    ConsecutiveFailures = source.ConsecutiveFailures,
                    Reason = $"Nguồn '{source.Name}' gặp lỗi liên tiếp 5 lần ({errorMessage}). Hệ thống đã tự động ngắt mạch (Circuit Breaker)!",
                    TriggeredAt = DateTime.UtcNow
                }, cancellationToken);

                Console.WriteLine($"⚡ [CIRCUIT BREAKER] Đã tự động tắt nguồn cào '{source.Name}' do lỗi liên tiếp 5 lần.");
            }

            // Ghi nhật ký vào bảng crawler_logs
            var log = new CrawlerLog
            {
                Id = Guid.NewGuid(),
                CrawlerSourceId = source.Id,
                ScannedAt = DateTime.UtcNow,
                ArticlesFound = articlesFound,
                ArticlesInserted = articlesInserted,
                DurationMs = sw.ElapsedMilliseconds,
                IsSuccess = isSuccess,
                ErrorMessage = errorMessage,
                HttpStatusCode = httpStatusCode
            };

            _dbContext.CrawlerLogs.Add(log);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<string> ScrapeArticleContentAsync(
        string url, string selectorsJson, CancellationToken cancellationToken)
    {
        // Giữ nguyên logic bóc tách HTML hiện có của bạn
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
                }
                catch { }
            }

            bodyNode ??= doc.DocumentNode.SelectSingleNode("//article") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'article-body')]") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'fck_detail')]") ??
                         doc.DocumentNode.SelectSingleNode("//div[contains(@class,'content')]");

            return bodyNode?.InnerText.Trim() ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}

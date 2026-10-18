using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Infrastructure.Services;

namespace NewsRadar.Infrastructure.BackgroundServices;

public class CrawlerBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CrawlerBackgroundService> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(10); // Chạy định kỳ 10 phút/lần

    public CrawlerBackgroundService(IServiceScopeFactory scopeFactory, ILogger<CrawlerBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 [Crawler Worker] Engine Cào tin tự động đã khởi động...");

        using var timer = new PeriodicTimer(_period);

        // Chạy cào tin ngay lập tức khi ứng dụng vừa bật, sau đó mới lặp lại theo PeriodicTimer
        do
        {
            _logger.LogInformation("⏳ [Crawler Worker] Bắt đầu chu kỳ cào tin lúc: {Time}", DateTimeOffset.Now);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var crawlerService = scope.ServiceProvider.GetRequiredService<NewsCrawlerService>();

                // Lấy tất cả các nguồn tin đang ở trạng thái Active = true
                var activeSources = await dbContext.CrawlerSources
                    .Where(s => s.IsActive)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("🔍 Tìm thấy {Count} nguồn cào đang hoạt động.", activeSources.Count);

                foreach (var source in activeSources)
                {
                    await crawlerService.CrawlSourceAsync(source, stoppingToken);
                }

                _logger.LogInformation("✅ [Crawler Worker] Hoàn thành chu kỳ cào tin.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [Crawler Worker] Gặp lỗi trong quá trình cào tin.");
            }

        } while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested);
    }
}
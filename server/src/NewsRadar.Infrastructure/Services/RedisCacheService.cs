using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NewsRadar.Application.Common.Interfaces;
using StackExchange.Redis;

namespace NewsRadar.Infrastructure.Services;

/// <summary>
/// Dịch vụ Redis Cache quản lý bộ nhớ đệm phân tán.
/// Tích hợp cơ chế tự phục hồi (Lazy Connect & AbortOnConnectFail = false) chuẩn Enterprise.
/// </summary>
public class RedisCacheService : IRedisCacheService
{
    private readonly Lazy<IConnectionMultiplexer?> _redis;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        _redis = new Lazy<IConnectionMultiplexer?>(() =>
        {
            var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
            try
            {
                var options = ConfigurationOptions.Parse(connectionString);
                options.AbortOnConnectFail = false; // Không crash app nếu Redis chưa sẵn sàng
                options.ConnectTimeout = 3000;
                return ConnectionMultiplexer.Connect(options);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Không thể khởi tạo kết nối Redis ({Message}). Tính năng cache sẽ chạy ở chế độ fallback.", ex.Message);
                return null;
            }
        });
    }

    private IDatabase? Database => _redis.Value?.IsConnected == true ? _redis.Value.GetDatabase() : null;

    public async Task<T?> GetCachedDataAsync<T>(string key)
    {
        try
        {
            var db = Database;
            if (db == null) return default;

            var json = await db.StringGetAsync(key);
            if (json.IsNullOrEmpty) return default;
            return JsonSerializer.Deserialize<T>(json.ToString()!);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Lỗi đọc cache Redis cho key '{Key}': {Message}", key, ex.Message);
            return default;
        }
    }

    public async Task SetCachedDataAsync<T>(string key, T data, TimeSpan expiration)
    {
        try
        {
            var db = Database;
            if (db == null) return;

            var json = JsonSerializer.Serialize(data);
            await db.StringSetAsync(key, json, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Lỗi ghi cache Redis cho key '{Key}': {Message}", key, ex.Message);
        }
    }

    public async Task RemoveDataAsync(string key)
    {
        try
        {
            var db = Database;
            if (db == null) return;

            await db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Lỗi xóa cache Redis cho key '{Key}': {Message}", key, ex.Message);
        }
    }
}
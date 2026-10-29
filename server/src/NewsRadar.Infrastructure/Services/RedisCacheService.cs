using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NewsRadar.Application.Common.Interfaces;
using StackExchange.Redis;

namespace NewsRadar.Infrastructure.Services;

/// <summary>
/// Dịch vụ Redis Cache quản lý bộ nhớ đệm phân tán.
/// Tích hợp cơ chế tự phục hồi (Lazy Connect & AbortOnConnectFail = false) chuẩn Enterprise.
/// Hỗ trợ cả URI chuẩn (redis://, rediss://) và định dạng chuỗi kết nối chuẩn StackExchange.Redis.
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
                ConfigurationOptions options;
                if (connectionString.StartsWith("redis://", StringComparison.OrdinalIgnoreCase) ||
                    connectionString.StartsWith("rediss://", StringComparison.OrdinalIgnoreCase))
                {
                    var uri = new Uri(connectionString);
                    var userInfo = uri.UserInfo;
                    var password = userInfo.Contains(':') ? userInfo.Split(':', 2)[1] : userInfo;
                    options = new ConfigurationOptions
                    {
                        EndPoints = { $"{uri.Host}:{(uri.Port > 0 ? uri.Port : 6379)}" },
                        Password = string.IsNullOrEmpty(password) ? null : password,
                        Ssl = connectionString.StartsWith("rediss://", StringComparison.OrdinalIgnoreCase),
                        AbortOnConnectFail = false,
                        ConnectTimeout = 10000,
                        SyncTimeout = 10000
                    };
                }
                else
                {
                    options = ConfigurationOptions.Parse(connectionString);
                    options.AbortOnConnectFail = false; // Không crash app nếu Redis chưa sẵn sàng
                    options.ConnectTimeout = 10000;
                    options.SyncTimeout = 10000;
                }

                return ConnectionMultiplexer.Connect(options);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Không thể khởi tạo kết nối Redis ({Message}). Tính năng cache sẽ chạy ở chế độ fallback.", ex.Message);
                return null;
            }
        });
    }

    private IDatabase? Database
    {
        get
        {
            try
            {
                return _redis.Value?.GetDatabase();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Không thể lấy Redis Database: {Message}", ex.Message);
                return null;
            }
        }
    }

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

using System.Text.Json;
using Microsoft.Extensions.Configuration;
using NewsRadar.Application.Common.Interfaces;
using StackExchange.Redis;

namespace NewsRadar.Infrastructure.Services;

public class RedisCacheService : IRedisCacheService
{
    private readonly IDatabase _db;

    public RedisCacheService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        var redis = ConnectionMultiplexer.Connect(connectionString);
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetCachedDataAsync<T>(string key)
    {
        var json = await _db.StringGetAsync(key);
        if (json.IsNullOrEmpty) return default;
        return JsonSerializer.Deserialize<T>(json.ToString()!);
    }

    public async Task SetCachedDataAsync<T>(string key, T data, TimeSpan expiration)
    {
        var json = JsonSerializer.Serialize(data);
        await _db.StringSetAsync(key, json, expiration);
    }

    public async Task RemoveDataAsync(string key)
    {
        await _db.KeyDeleteAsync(key);
    }
}
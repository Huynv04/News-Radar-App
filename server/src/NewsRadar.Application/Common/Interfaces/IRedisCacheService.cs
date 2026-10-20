namespace NewsRadar.Application.Common.Interfaces;

public interface IRedisCacheService
{
    Task<T?> GetCachedDataAsync<T>(string key);
    Task SetCachedDataAsync<T>(string key, T data, TimeSpan expiration);
    Task RemoveDataAsync(string key);
}
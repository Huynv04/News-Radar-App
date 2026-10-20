using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

public interface INlpService
{
    string ComputeSha256Hash(string rawText);
    (string Label, double Score) AnalyzeSentiment(string title, string sapo);
    double CalculateTrendScore(string title, string sapo, DateTime publishedAt);
    Task<int> ReprocessAllArticlesAsync();
    Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync();
}
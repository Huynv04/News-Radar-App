using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

/// <summary>
/// Xử lý các nghiệp vụ phân tích dữ liệu & Dashboard Analytics.
/// Tách biệt khỏi INlpService để tuân thủ Single Responsibility Principle.
/// </summary>
public interface IAnalyticsService
{
    /// <summary>
    /// Lấy toàn bộ dữ liệu Dashboard: Sentiment Chart, Tag Cloud, Top Trending Articles.
    /// </summary>
    Task<DashboardAnalyticsDto> GetDashboardAnalyticsAsync();

    /// <summary>
    /// Chạy lại toàn bộ NLP (Sentiment, TrendScore, ContentHash, Category) cho tất cả bài viết.
    /// Dùng khi Admin cần đồng bộ lại dữ liệu sau khi thay đổi thuật toán NLP.
    /// </summary>
    Task<int> ReprocessAllArticlesAsync();
}

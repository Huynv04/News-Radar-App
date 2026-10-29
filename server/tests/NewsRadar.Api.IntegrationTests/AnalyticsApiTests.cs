using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Api.IntegrationTests;

/// <summary>
/// Integration Tests cho Analytics API:
/// - GET /api/analytics/dashboard: trả về đúng cấu trúc DTO cho biểu đồ và thống kê
/// - POST /api/analytics/reprocess: kích hoạt tái phân tích NLP và lọc trùng thành công
/// </summary>
public class AnalyticsApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AnalyticsApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDashboard_Returns200WithCompleteDtoStructure()
    {
        // Act
        var response = await _client.GetAsync("/api/analytics/dashboard");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "dashboard analytics là API công khai phục vụ trực quan hóa dữ liệu");

        var dashboard = await response.Content.ReadFromJsonAsync<DashboardAnalyticsDto>();
        dashboard.Should().NotBeNull();

        // 1. Kiểm tra thống kê tổng quan
        dashboard!.TotalArticles.Should().BeGreaterThanOrEqualTo(0);

        // 2. Kiểm tra phân bổ Sắc thái (Sentiment)
        dashboard.SentimentStats.Should().NotBeNull(
            because: "biểu đồ tròn/donut cần danh sách phân bổ cảm xúc");

        // 3. Kiểm tra phân bổ Danh mục (Category)
        dashboard.CategoryStats.Should().NotBeNull(
            because: "biểu đồ cột cần danh sách phân bổ chủ đề");

        // 4. Kiểm tra danh sách Top bài viết Trending
        dashboard.TopTrendingArticles.Should().NotBeNull(
            because: "dashboard cần danh sách bài viết thịnh hành nhất");
    }

    [Fact]
    public async Task ReprocessArticles_Returns200WithSuccessMessage()
    {
        // Act
        var response = await _client.PostAsync("/api/analytics/reprocess", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("thành công");
    }
}

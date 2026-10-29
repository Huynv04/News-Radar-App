using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Api.IntegrationTests;

/// <summary>
/// Integration Tests cho Crawler Sources & Crawler Logs API:
/// - POST /api/crawler-sources (Quản lý nguồn cào - chỉ Admin)
/// - GET /api/crawler-sources (Danh sách nguồn cào)
/// - PUT /api/crawler-sources/{id} (Cập nhật cấu hình nguồn cào)
/// - PATCH /api/crawler-sources/{id}/status (Bật/tắt trạng thái nguồn)
/// - DELETE /api/crawler-sources/{id} (Xóa nguồn cào)
/// - GET /api/crawler-sources/logs/hourly-stats (Thống kê tiến trình cào theo giờ)
/// </summary>
public class CrawlerSourcesApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _anonClient;
    private readonly HttpClient _adminClient;
    private readonly HttpClient _userClient;

    public CrawlerSourcesApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _anonClient = factory.CreateClient();
        _adminClient = factory.CreateAuthenticatedClient(role: "Admin");
        _userClient = factory.CreateAuthenticatedClient(role: "User");
    }

    [Fact]
    public async Task CreateCrawlerSource_WithoutToken_Returns401Unauthorized()
    {
        var dto = new CreateCrawlerSourceDto
        {
            Id = "unauth-source",
            Name = "Unauth Source",
            RssUrl = "https://example.com/rss",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 10,
            Selectors = "{}"
        };

        var response = await _anonClient.PostAsJsonAsync("/api/crawler-sources", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateCrawlerSource_AsNonAdmin_Returns403Forbidden()
    {
        var dto = new CreateCrawlerSourceDto
        {
            Id = "user-source",
            Name = "User Source",
            RssUrl = "https://example.com/rss",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 10,
            Selectors = "{}"
        };

        var response = await _userClient.PostAsJsonAsync("/api/crawler-sources", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            because: "chỉ tài khoản Admin mới có quyền cấu hình nguồn cào");
    }

    [Fact]
    public async Task FullCrudLifecycle_AsAdmin_ShouldBeSuccessful()
    {
        var testId = $"source-{Guid.NewGuid():N}"[..12];

        // 1. POST (Create)
        var createDto = new CreateCrawlerSourceDto
        {
            Id = testId,
            Name = "Integration Test Source",
            RssUrl = "https://example.com/rss.xml",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 15,
            Selectors = "{\"title\":\"h1\"}"
        };

        var createResponse = await _adminClient.PostAsJsonAsync("/api/crawler-sources", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<CrawlerSourceDto>();
        created.Should().NotBeNull();
        created!.Id.Should().Be(testId);

        // 2. GET BY ID (Read)
        var getResponse = await _adminClient.GetAsync($"/api/crawler-sources/{testId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. PUT (Update)
        var updateDto = new UpdateCrawlerSourceDto
        {
            Name = "Updated Source Name",
            RssUrl = "https://example.com/rss-updated.xml",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 30,
            Selectors = "{\"title\":\"h1.updated\"}",
            IsActive = true
        };

        var updateResponse = await _adminClient.PutAsJsonAsync($"/api/crawler-sources/{testId}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<CrawlerSourceDto>();
        updated!.Name.Should().Be("Updated Source Name");

        // 4. PATCH (Toggle Status)
        var patchResponse = await _adminClient.PatchAsync($"/api/crawler-sources/{testId}/status?isActive=false", null);
        patchResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. DELETE (Delete)
        var deleteResponse = await _adminClient.DeleteAsync($"/api/crawler-sources/{testId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 6. VERIFY DELETED
        var verifyGet = await _adminClient.GetAsync($"/api/crawler-sources/{testId}");
        verifyGet.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetHourlyStats_AsAdmin_Returns200WithHourlyStatsList()
    {
        // Act
        var response = await _adminClient.GetAsync("/api/crawler-sources/logs/hourly-stats");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var stats = await response.Content.ReadFromJsonAsync<List<CrawlerHourlyStatDto>>();
        stats.Should().NotBeNull();
        stats!.Should().NotBeEmpty(because: "đã seed dữ liệu nhật ký cào tin (CrawlerLog)");
    }
}

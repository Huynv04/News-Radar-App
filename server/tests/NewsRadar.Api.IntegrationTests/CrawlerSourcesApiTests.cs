using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using NewsRadar.Application.Common.DTOs;
using Xunit;
using Xunit.Abstractions;

namespace NewsRadar.Api.IntegrationTests;

public class CrawlerSourcesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public CrawlerSourcesApiTests(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _client = factory.CreateClient();
        _output = output;
    }

    [Fact]
    public async Task FullCrudLifecycle_ShouldBeSuccessful()
    {
        var testId = $"test-source-{Guid.NewGuid().ToString()[..8]}";

        // 1. TEST POST (Create)
        var createDto = new CreateCrawlerSourceDto
        {
            Id = testId,
            Name = "Integration Test Source",
            RssUrl = "https://example.com/rss.xml",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 15,
            Selectors = "{\"title\":\"h1\"}"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/crawler-sources", createDto);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdJson = await createResponse.Content.ReadAsStringAsync();
        _output.WriteLine($"[POST CREATED]:\n{createdJson}\n");

        // 2. TEST GET BY ID (Read)
        var getResponse = await _client.GetAsync($"/api/v1/crawler-sources/{testId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 3. TEST PUT (Update)
        var updateDto = new UpdateCrawlerSourceDto
        {
            Name = "Updated Test Source Name",
            RssUrl = "https://example.com/rss-updated.xml",
            BaseUrl = "https://example.com",
            ScanIntervalMinutes = 30,
            Selectors = "{\"title\":\"h1.updated\"}",
            IsActive = true
        };

        var updateResponse = await _client.PutAsJsonAsync($"/api/v1/crawler-sources/{testId}", updateDto);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedJson = await updateResponse.Content.ReadAsStringAsync();
        _output.WriteLine($"[PUT UPDATED]:\n{updatedJson}\n");

        // 4. TEST PATCH (Toggle Status)
        var patchResponse = await _client.PatchAsync($"/api/v1/crawler-sources/{testId}/status?isActive=false", null);
        patchResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 5. TEST DELETE (Delete)
        var deleteResponse = await _client.DeleteAsync($"/api/v1/crawler-sources/{testId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 6. VERIFY DELETED
        var verifyGet = await _client.GetAsync($"/api/v1/crawler-sources/{testId}");
        verifyGet.StatusCode.Should().Be(HttpStatusCode.NotFound);
        _output.WriteLine($"[DELETE VERIFIED]: Entity successfully deleted.");
    }
}
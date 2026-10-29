using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Api.IntegrationTests;

/// <summary>
/// Integration Tests cho Bookmarks API:
/// - POST /api/bookmarks (chưa auth -> 401, đã auth -> 201)
/// - GET /api/bookmarks (lấy danh sách bài đã lưu của đúng user)
/// - DELETE /api/bookmarks/{articleId} (xóa bookmark)
/// - Cô lập dữ liệu giữa các User (User A không thấy bookmark của User B)
/// </summary>
public class BookmarksApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _anonClient;

    public BookmarksApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _anonClient = factory.CreateClient();
    }

    [Fact]
    public async Task AddBookmark_WithoutToken_Returns401Unauthorized()
    {
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var request = new AddBookmarkRequest(articleId);

        var response = await _anonClient.PostAsJsonAsync("/api/bookmarks", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            because: "tính năng Bookmark yêu cầu người dùng phải đăng nhập");
    }

    [Fact]
    public async Task BookmarkLifecycle_AddGetAndDelete_ShouldSucceedForAuthenticatedUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var userClient = _factory.CreateAuthenticatedClient(role: "User", userId: userId);
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // 1. Thêm Bookmark
        var addRequest = new AddBookmarkRequest(articleId);
        var addResponse = await userClient.PostAsJsonAsync("/api/bookmarks", addRequest);
        addResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await addResponse.Content.ReadFromJsonAsync<BookmarkDto>();
        created.Should().NotBeNull();
        created!.ArticleId.Should().Be(articleId);
        created.ArticleTitle.Should().NotBeNullOrEmpty();

        // 2. Lấy danh sách Bookmark
        var getResponse = await userClient.GetAsync("/api/bookmarks");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var list = await getResponse.Content.ReadFromJsonAsync<List<BookmarkDto>>();
        list.Should().NotBeNull();
        list.Should().Contain(b => b.ArticleId == articleId);

        // 3. Kiểm tra status endpoint
        var statusResponse = await userClient.GetAsync($"/api/bookmarks/{articleId}/status");
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // 4. Xóa Bookmark
        var deleteResponse = await userClient.DeleteAsync($"/api/bookmarks/{articleId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // 5. Xác nhận đã xóa thành công
        var verifyResponse = await userClient.GetAsync("/api/bookmarks");
        var verifyList = await verifyResponse.Content.ReadFromJsonAsync<List<BookmarkDto>>();
        verifyList.Should().NotContain(b => b.ArticleId == articleId);
    }

    [Fact]
    public async Task Bookmarks_AreIsolatedBetweenDifferentUsers()
    {
        // Arrange: User A và User B
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();
        var clientA = _factory.CreateAuthenticatedClient(role: "User", userId: userAId);
        var clientB = _factory.CreateAuthenticatedClient(role: "User", userId: userBId);
        var articleId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        // User A thêm bookmark
        var addResponse = await clientA.PostAsJsonAsync("/api/bookmarks", new AddBookmarkRequest(articleId));
        addResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // User B kiểm tra danh sách bookmark của mình -> KHÔNG được có bài của User A
        var listBResponse = await clientB.GetAsync("/api/bookmarks");
        listBResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var listB = await listBResponse.Content.ReadFromJsonAsync<List<BookmarkDto>>();
        listB.Should().NotContain(b => b.ArticleId == articleId,
            because: "bookmark của User A không được hiển thị cho User B (Cross-user isolation)");
    }
}


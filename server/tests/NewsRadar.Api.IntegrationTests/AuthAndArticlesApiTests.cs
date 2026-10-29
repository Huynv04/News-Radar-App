using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Api.IntegrationTests;

/// <summary>
/// Integration Tests cho Auth API — kiểm tra luồng HTTP request → Controller → Service → Database thực.
/// Demo 2 test cases: Register và Login.
/// </summary>
public class AuthApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 1: Đăng ký tài khoản mới → 201 Created + JWT token
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithValidData_Returns201WithTokens()
    {
        // Arrange — dùng email ngẫu nhiên để tránh conflict giữa các lần chạy
        var request = new RegisterRequest(
            DisplayName: "Test User",
            Email: $"testuser_{Guid.NewGuid():N}@newsradar.test",
            Password: "Test@12345"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert — HTTP status
        response.StatusCode.Should().Be(HttpStatusCode.Created,
            because: "email chưa tồn tại, đăng ký hợp lệ phải trả về 201");

        // Assert — response body chứa token
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse.Should().NotBeNull();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty(
            because: "phải trả về JWT access token");
        authResponse.RefreshToken.Should().NotBeNullOrEmpty(
            because: "phải trả về refresh token");
        authResponse.User.Email.Should().Be(request.Email.ToLower(),
            because: "email trong profile phải khớp với email đăng ký");
        authResponse.User.Role.Should().Be("User",
            because: "tài khoản mới mặc định có role là User");
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_Returns409Conflict()
    {
        // Arrange — đăng ký lần 1 thành công
        var email = $"duplicate_{Guid.NewGuid():N}@newsradar.test";
        var firstRequest = new RegisterRequest("User One", email, "Password@1");
        await _client.PostAsJsonAsync("/api/auth/register", firstRequest);

        // Act — đăng ký lần 2 cùng email
        var secondRequest = new RegisterRequest("User Two", email, "Password@2");
        var response = await _client.PostAsJsonAsync("/api/auth/register", secondRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict,
            because: "email đã tồn tại phải trả về 409 Conflict");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 2: Đăng nhập → 200 OK với JWT; Sai mật khẩu → 401
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithCorrectCredentials_Returns200WithAccessToken()
    {
        // Arrange — tạo tài khoản trước
        var email = $"login_test_{Guid.NewGuid():N}@newsradar.test";
        var password = "Login@12345";
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("Login Tester", email, password));

        // Act
        var loginRequest = new LoginRequest(email, password);
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "credentials hợp lệ phải đăng nhập thành công");

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        authResponse!.AccessToken.Should().NotBeNullOrEmpty(
            because: "đăng nhập thành công phải trả về access token");
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401Unauthorized()
    {
        // Arrange — tạo tài khoản trước
        var email = $"wrong_pass_{Guid.NewGuid():N}@newsradar.test";
        await _client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("Wrong Pass User", email, "Correct@12345"));

        // Act — đăng nhập với mật khẩu SAI
        var loginRequest = new LoginRequest(email, "WrongPassword@999");
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized,
            because: "mật khẩu sai phải trả về 401 Unauthorized");
    }
}

/// <summary>
/// Integration Tests cho Articles API — Cursor Pagination và Full-Text Search.
/// Demo 2 test cases.
/// </summary>
public class ArticlesApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public ArticlesApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 1: GET /api/articles → 200 OK + đúng cấu trúc
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetArticles_WithoutFilter_Returns200WithCursorPagedResult()
    {
        // Act
        var response = await _client.GetAsync("/api/articles?pageSize=5");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CursorPagedResult<ArticleDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeNull(
            because: "response phải luôn có danh sách Items (dù rỗng)");
        result.Items.Count.Should().BeLessThanOrEqualTo(5,
            because: "pageSize=5 không được trả về quá 5 bài");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 2: Filter theo từ khóa (Search Keyword)
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetArticles_WithKeywordFilter_ReturnsMatchingArticles()
    {
        // Act
        var response = await _client.GetAsync("/api/articles?searchKeyword=AI");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CursorPagedResult<ArticleDto>>();
        result.Should().NotBeNull();
        result!.Items.Should().NotBeEmpty(because: "đã seed bài viết có từ khóa AI");
        result.Items.Should().OnlyContain(a =>
            a.Title.Contains("AI", StringComparison.OrdinalIgnoreCase) ||
            a.Sapo.Contains("AI", StringComparison.OrdinalIgnoreCase));
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 3: Cursor Pagination hoạt động tuần tự chính xác
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetArticles_WithCursorPagination_NavigatesPagesCorrectly()
    {
        // Act — Lấy trang 1 với pageSize=2
        var page1Response = await _client.GetAsync("/api/articles?pageSize=2");
        page1Response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page1 = await page1Response.Content.ReadFromJsonAsync<CursorPagedResult<ArticleDto>>();
        page1.Should().NotBeNull();
        page1!.Items.Count.Should().Be(2);
        page1.HasNextPage.Should().BeTrue();
        page1.NextLastPublishedAt.Should().NotBeNull();
        page1.NextLastId.Should().NotBeNull();

        // Act — Lấy trang 2 dùng cursor trả về từ trang 1
        var cursorUrl = $"/api/articles?pageSize=2&lastPublishedAt={Uri.EscapeDataString(page1.NextLastPublishedAt!.Value.ToString("O"))}&lastId={page1.NextLastId}";
        var page2Response = await _client.GetAsync(cursorUrl);
        page2Response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page2 = await page2Response.Content.ReadFromJsonAsync<CursorPagedResult<ArticleDto>>();
        page2.Should().NotBeNull();
        page2!.Items.Should().NotBeEmpty();

        // Không có bài viết nào ở trang 2 bị trùng với trang 1
        var page1Ids = page1.Items.Select(a => a.Id).ToHashSet();
        page2.Items.Should().NotContain(a => page1Ids.Contains(a.Id));
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 4: Admin Pin bài viết — 401 không token, 403 User, 200 Admin
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task TogglePinArticle_WithoutToken_Returns401Unauthorized()
    {
        var fakeArticleId = Guid.NewGuid();
        var response = await _client.PatchAsync($"/api/articles/{fakeArticleId}/pin", null);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TogglePinArticle_AsNonAdmin_Returns403Forbidden()
    {
        var userClient = _factory.CreateAuthenticatedClient(role: "User");
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var response = await userClient.PatchAsync($"/api/articles/{articleId}/pin", null);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            because: "user có role User không được phép ghim bài viết");
    }

    [Fact]
    public async Task TogglePinArticle_AsAdmin_TogglesPinSuccessfully()
    {
        var adminClient = _factory.CreateAuthenticatedClient(role: "Admin");
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // Lần 1: Ghim bài viết
        var pinResponse = await adminClient.PatchAsync($"/api/articles/{articleId}/pin", null);
        pinResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Lần 2: Bỏ ghim bài viết
        var unpinResponse = await adminClient.PatchAsync($"/api/articles/{articleId}/pin", null);
        unpinResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 5: Admin Override Metadata — 403 User, 200 Admin
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task OverrideMetadata_AsNonAdmin_Returns403Forbidden()
    {
        var userClient = _factory.CreateAuthenticatedClient(role: "User");
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var dto = new OverrideArticleDto { Category = "Kinh tế", SentimentLabel = "Neutral" };
        var response = await userClient.PatchAsJsonAsync($"/api/articles/{articleId}/override", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden,
            because: "user thường không được can thiệp thủ công metadata bài viết");
    }

    [Fact]
    public async Task OverrideMetadata_AsAdmin_UpdatesCategoryAndSentiment()
    {
        var adminClient = _factory.CreateAuthenticatedClient(role: "Admin");
        var articleId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var dto = new OverrideArticleDto { Category = "Kinh tế", SentimentLabel = "Neutral" };
        var response = await adminClient.PatchAsJsonAsync($"/api/articles/{articleId}/override", dto);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<ArticleDto>();
        updated.Should().NotBeNull();
        updated!.Category.Should().Be("Kinh tế");
        updated.SentimentLabel.Should().Be("Neutral");
    }
}


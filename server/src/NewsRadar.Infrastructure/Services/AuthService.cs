using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Infrastructure.Services;

/// <summary>
/// Xử lý đăng ký/đăng nhập Email+Password và Google OAuth2.
/// Không dùng ASP.NET Identity để giữ codebase nhẹ và kiểm soát hoàn toàn.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly HttpClient _httpClient;
    private readonly int _refreshTokenDays;

    public AuthService(
        IApplicationDbContext db,
        IJwtService jwtService,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _jwtService = jwtService;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _refreshTokenDays = int.Parse(configuration["Jwt:RefreshTokenDays"] ?? "30");
    }

    // ── Register ──────────────────────────────────────────────────────────────

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _db.AppUsers
            .AnyAsync(u => u.Email == request.Email.ToLower(), cancellationToken);

        if (exists)
            throw new InvalidOperationException("Email đã được sử dụng.");

        var user = new AppUser
        {
            DisplayName = request.DisplayName.Trim(),
            Email = request.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User"
        };

        _db.AppUsers.Add(user);

        // Gán refresh token
        user.RefreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenDays);

        await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Người dùng mới đăng ký: {Email}", user.Email);

        return BuildAuthResponse(user);
    }

    // ── Login Email/Password ──────────────────────────────────────────────────

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower(), cancellationToken)
            ?? throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        if (string.IsNullOrEmpty(user.PasswordHash) ||
            !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        await RotateRefreshTokenAsync(user, cancellationToken);
        return BuildAuthResponse(user);
    }

    // ── Login với Google OAuth2 ───────────────────────────────────────────────

    public async Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken cancellationToken = default)
    {
        // Xác thực Google ID Token bằng cách gọi Google tokeninfo endpoint
        var googleInfo = await VerifyGoogleTokenAsync(request.IdToken)
            ?? throw new UnauthorizedAccessException("Google ID Token không hợp lệ.");

        // Tìm user theo GoogleId hoặc Email
        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.GoogleId == googleInfo.Sub || u.Email == googleInfo.Email, cancellationToken);

        if (user is null)
        {
            // Auto-register: tạo tài khoản mới từ Google profile
            user = new AppUser
            {
                DisplayName = googleInfo.Name,
                Email = googleInfo.Email.ToLower(),
                GoogleId = googleInfo.Sub,
                AvatarUrl = googleInfo.Picture,
                Role = "User"
            };
            _db.AppUsers.Add(user);
        }
        else
        {
            // Cập nhật Google info nếu cần
            user.GoogleId ??= googleInfo.Sub;
            user.AvatarUrl = googleInfo.Picture;
        }

        await RotateRefreshTokenAsync(user, cancellationToken);
        _logger.LogInformation("Google login: {Email}", user.Email);
        return BuildAuthResponse(user);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _db.AppUsers
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken)
            ?? throw new UnauthorizedAccessException("Refresh token không hợp lệ.");

        if (user.RefreshTokenExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");

        await RotateRefreshTokenAsync(user, cancellationToken);
        return BuildAuthResponse(user);
    }

    // ── Revoke (Logout) ───────────────────────────────────────────────────────

    public async Task RevokeRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.AppUsers.FindAsync([userId], cancellationToken)
            ?? throw new KeyNotFoundException("User không tồn tại.");

        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    // ── Get Profile ───────────────────────────────────────────────────────────

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.AppUsers.FindAsync([userId], cancellationToken)
            ?? throw new KeyNotFoundException("User không tồn tại.");

        return new UserProfileDto(user.Id, user.DisplayName, user.Email, user.AvatarUrl, user.Role);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private async Task RotateRefreshTokenAsync(AppUser user, CancellationToken cancellationToken)
    {
        user.RefreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenDays);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    private AuthResponse BuildAuthResponse(AppUser user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var profile = new UserProfileDto(user.Id, user.DisplayName, user.Email, user.AvatarUrl, user.Role);
        return new AuthResponse(accessToken, user.RefreshToken!, profile);
    }

    private async Task<GoogleTokenInfo?> VerifyGoogleTokenAsync(string idToken)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

            if (!response.IsSuccessStatusCode) return null;

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GoogleTokenInfo>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xác thực Google ID Token");
            return null;
        }
    }

    private record GoogleTokenInfo(
        string Sub,
        string Email,
        string Name,
        string? Picture
    );
}

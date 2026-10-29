using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using NewsRadar.Domain.Entities;
using NewsRadar.Infrastructure.Services;

namespace NewsRadar.UnitTests.Services;

/// <summary>
/// Unit Tests cho JwtService — kiểm tra logic phát sinh Access Token, Refresh Token
/// và giải mã / xác thực Claims của người dùng.
/// </summary>
public class JwtServiceTests
{
    private const string ValidSecretKey = "SuperSecretKeyForTestingNewsRadarApp1234567890!@#$";
    private const string Issuer = "NewsRadarTestIssuer";
    private const string Audience = "NewsRadarTestAudience";

    private readonly Mock<IConfiguration> _configMock;
    private readonly JwtService _sut;

    public JwtServiceTests()
    {
        _configMock = new Mock<IConfiguration>();
        _configMock.Setup(c => c["Jwt:Secret"]).Returns(ValidSecretKey);
        _configMock.Setup(c => c["Jwt:Issuer"]).Returns(Issuer);
        _configMock.Setup(c => c["Jwt:Audience"]).Returns(Audience);
        _configMock.Setup(c => c["Jwt:AccessTokenMinutes"]).Returns("60");

        _sut = new JwtService(_configMock.Object);
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 1: GenerateAccessToken — Sinh JWT hợp lệ kèm Claims
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateAccessToken_WithValidUser_ReturnsValidJwtWithCorrectClaims()
    {
        // Arrange
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            DisplayName = "Nguyen Van A",
            Email = "nguyenvana@example.com",
            Role = "Admin"
        };

        // Act
        var token = _sut.GenerateAccessToken(user);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3, because: "JWT access token hợp lệ phải có 3 phần Header.Payload.Signature");

        // Giải mã và kiểm tra Claims bên trong token
        var principal = _sut.ValidateExpiredAccessToken(token);
        principal.Should().NotBeNull();

        var subClaim = principal!.FindFirst(JwtRegisteredClaimNames.Sub) ?? principal.FindFirst(ClaimTypes.NameIdentifier);
        subClaim.Should().NotBeNull();
        subClaim!.Value.Should().Be(user.Id.ToString(), because: "Sub claim phải trùng khớp với UserId");

        var emailClaim = principal.FindFirst(JwtRegisteredClaimNames.Email) ?? principal.FindFirst(ClaimTypes.Email);
        emailClaim.Should().NotBeNull();
        emailClaim!.Value.Should().Be(user.Email);

        var nameClaim = principal.FindFirst(JwtRegisteredClaimNames.Name) ?? principal.FindFirst(ClaimTypes.Name);
        nameClaim.Should().NotBeNull();
        nameClaim!.Value.Should().Be(user.DisplayName);

        var roleClaim = principal.FindFirst(ClaimTypes.Role);
        roleClaim.Should().NotBeNull();
        roleClaim!.Value.Should().Be(user.Role, because: "Role claim dùng cho phân quyền Authorization");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 2: GenerateRefreshToken — Sinh chuỗi ngẫu nhiên bảo mật
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void GenerateRefreshToken_GeneratesUniqueCryptographicallySecureBase64Tokens()
    {
        // Act: Sinh 2 Refresh Token liên tiếp
        var token1 = _sut.GenerateRefreshToken();
        var token2 = _sut.GenerateRefreshToken();

        // Assert
        token1.Should().NotBeNullOrWhiteSpace();
        token2.Should().NotBeNullOrWhiteSpace();

        // Mỗi lần sinh token ngẫu nhiên phải độc nhất
        token1.Should().NotBe(token2, because: "2 Refresh Token sinh ra liên tiếp phải là ngẫu nhiên và không trùng nhau");

        // Kiểm tra định dạng hợp lệ của Base64
        var isBase64 = Convert.TryFromBase64String(token1, new byte[64], out int bytesWritten);
        isBase64.Should().BeTrue();
        bytesWritten.Should().Be(64, because: "Refresh token được sinh từ 64-byte random bytes");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 3: ValidateExpiredAccessToken — Token rác / sai chữ ký trả về null
    // ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("invalid.token.structure")]
    [InlineData("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M")] // Signature sai
    [InlineData("")]
    public void ValidateExpiredAccessToken_WithInvalidOrTamperedToken_ReturnsNull(string invalidToken)
    {
        // Act
        var principal = _sut.ValidateExpiredAccessToken(invalidToken);

        // Assert
        principal.Should().BeNull(because: "token không hợp lệ hoặc đã bị chỉnh sửa chữ ký phải bị từ chối và trả về null");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 4: Khởi tạo khi thiếu Jwt:Secret trong Configuration
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void Constructor_WithoutSecretConfigured_ThrowsInvalidOperationException()
    {
        // Arrange
        var emptyConfigMock = new Mock<IConfiguration>();
        emptyConfigMock.Setup(c => c["Jwt:Secret"]).Returns((string?)null);

        // Act & Assert
        var act = () => new JwtService(emptyConfigMock.Object);
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*Jwt:Secret is not configured*");
    }
}


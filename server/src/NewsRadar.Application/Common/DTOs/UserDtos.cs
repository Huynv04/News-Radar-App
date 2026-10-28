namespace NewsRadar.Application.Common.DTOs;

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

public record RegisterRequest(
    string DisplayName,
    string Email,
    string Password
);

public record LoginRequest(
    string Email,
    string Password
);

public record GoogleLoginRequest(
    string IdToken // Google ID Token nhận từ Google Sign-In trên client
);

public record GitHubLoginRequest(
    string Code, // Mã ủy quyền OAuth2 trả về từ GitHub
    string? RedirectUri
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserProfileDto User
);

// ── User Profile DTOs ─────────────────────────────────────────────────────────

public record UserProfileDto(
    Guid Id,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    string Role
);

// ── Bookmark DTOs ─────────────────────────────────────────────────────────────

public record BookmarkDto(
    Guid Id,
    Guid ArticleId,
    string ArticleTitle,
    string ArticleUrl,
    string ArticleSapo,
    string CrawlerSourceName,
    DateTime PublishedAt,
    DateTime SavedAt
);

public record AddBookmarkRequest(Guid ArticleId);

// ── Subscription DTOs ─────────────────────────────────────────────────────────

public record SubscriptionDto(
    Guid Id,
    string Keyword,
    string? Category,
    string Channel,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateSubscriptionRequest(
    string Keyword,
    string? Category,
    string Channel // "Email" | "InApp"
);

public record UpdateSubscriptionRequest(
    string Keyword,
    string? Category,
    string Channel,
    bool IsActive
);

public record ReadingHistoryDto(
    Guid Id,
    Guid ArticleId,
    string ArticleTitle,
    string ArticleUrl,
    string ArticleSapo,
    string? Category,
    string CrawlerSourceName,
    DateTime PublishedAt,
    DateTime ReadAt
);

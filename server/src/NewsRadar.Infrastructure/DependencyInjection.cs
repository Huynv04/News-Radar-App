using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Infrastructure.BackgroundServices;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Infrastructure.Services;

namespace NewsRadar.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Dang ky toan bo Infrastructure services vao DI container.
    /// Program.cs chi can goi phuong thuc nay - khong can biet chi tiet ben trong.
    /// </summary>
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ── Database ───────────────────────────────────────────────────────────
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                   .UseSnakeCaseNamingConvention());

        services.AddScoped<IApplicationDbContext>(p =>
            p.GetRequiredService<ApplicationDbContext>());

        // ── NLP Service (Singleton - pure stateless computation) ───────────────
        services.AddSingleton<INlpService, NlpService>();

        // ── Redis Cache (Singleton - thread-safe connection multiplexer) ───────
        services.AddSingleton<IRedisCacheService, RedisCacheService>();

        // ── Application Services (Scoped - dependen tren DbContext) ───────────
        services.AddScoped<ICrawlerSourceService, CrawlerSourceService>();
        services.AddScoped<IArticleService, ArticleService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();

        // ── Crawler HTTP Client + Service (Typed HttpClient = Transient) ───────
        services.AddHttpClient<NewsCrawlerService>();

        // ── Background Service (Singleton managed by host) ────────────────────
        services.AddHostedService<CrawlerBackgroundService>();

        // ── Module 6: Auth, Bookmark, Subscription ────────────────────────────
        services.AddSingleton<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBookmarkService, BookmarkService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IReadingHistoryService, ReadingHistoryService>();
        services.AddScoped<IEmailNotificationService, EmailNotificationService>();

        // ── JWT Bearer Authentication ──────────────────────────────────────────
        var jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret is not configured.");
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "NewsRadar";
        var jwtAudience = configuration["Jwt:Audience"] ?? "NewsRadarClient";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
                // ── Bổ sung để SignalR đọc được JWT từ query string ?access_token=... ──
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/news"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization();

        return services;
    }
}


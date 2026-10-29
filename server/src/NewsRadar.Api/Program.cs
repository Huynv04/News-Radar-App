using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.Events;
using NewsRadar.Infrastructure;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── CORS (Bắt buộc cấu hình AllowCredentials cho SignalR WebSocket) ────────────
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
    options.AddPolicy("AllowReactApp", policy =>
        policy.WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));

// ── Core Services ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ── Infrastructure (DI: Database, Services, BackgroundService, Redis) ─────────
builder.Services.AddInfrastructureServices(builder.Configuration);

// ── MediatR (Quét cả 2 assembly: Application Events + Api Handlers) ───────────
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblies(
        typeof(HotArticleDetectedEvent).Assembly, // NewsRadar.Application
        typeof(Program).Assembly));               // NewsRadar.Api

// ── SignalR ───────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Global RFC 7807 Exception Handler ─────────────────────────────────────────
app.UseMiddleware<NewsRadar.Api.Middleware.GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp"); // Áp dụng một lần duy nhất trước MapControllers

app.UseAuthentication(); // ← Module 6: JWT Bearer Authentication
app.UseAuthorization();
app.MapControllers();
app.MapHub<NewsHub>("/hubs/news");


// ── Auto-migrate Database khi khởi động (kèm log cảnh báo nếu DB chưa sẵn sàng) ──
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (dbContext.Database.IsRelational())
    {
        await dbContext.Database.MigrateAsync();
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning("Không thể chạy database migration tự động ({Message}). Đảm bảo PostgreSQL đang chạy.", ex.Message);
}

app.Run();

// Hỗ trợ WebApplicationFactory cho Integration Tests
public partial class Program { }

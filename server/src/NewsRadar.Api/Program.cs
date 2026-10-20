using Microsoft.EntityFrameworkCore;
using NewsRadar.Infrastructure;
using NewsRadar.Infrastructure.BackgroundServices;
using NewsRadar.Infrastructure.Services;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Application.Interfaces;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Application.Common.Events;
using NewsRadar.Api.Hubs;
var builder = WebApplication.CreateBuilder(args);

// ĐĂNG KÝ TẤT CẢ CÁC DỊCH VỤ (TẤT CẢ PHẢI NẰM TRƯỚC builder.Build())
// 1. Thêm dịch vụ CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Port mặc định của Vite React
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Đăng ký Infrastructure Services (bao gồm PostgreSQL DbContext)
builder.Services.AddInfrastructureServices(builder.Configuration);
// 1. Đăng ký HttpClient & NewsCrawlerService
builder.Services.AddHttpClient<NewsCrawlerService>();

builder.Services.AddScoped<IArticleService, ArticleService>();
// 2. Đăng ký BackgroundService chạy ngầm
builder.Services.AddHostedService<CrawlerBackgroundService>();
builder.Services.AddScoped<INlpService, NlpService>();
builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();
builder.Services.AddSignalR();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(HotArticleDetectedEvent).Assembly));

// Đăng ký Handler từ tầng Api assembly
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
// 2. Kích hoạt Middleware CORS (Đặt trước UseAuthorization/MapControllers)
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

// Tự động kiểm tra và áp dụng Migration vào Database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}
// Bật CORS và Map Hub
app.UseCors("AllowAll");
app.MapHub<NewsHub>("/hubs/news");
app.Run();
// Thêm dòng này ở cuối cùng của file Program.cs
public partial class Program { }
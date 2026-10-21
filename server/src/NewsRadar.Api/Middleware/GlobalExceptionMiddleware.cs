using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace NewsRadar.Api.Middleware;

/// <summary>
/// Middleware bắt và chuẩn hóa toàn bộ lỗi ngoại lệ chưa xử lý theo chuẩn RFC 7807 ProblemDetails.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra ngoại lệ không được xử lý: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var statusCode = exception switch
        {
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            ArgumentException or InvalidOperationException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            _ => (int)HttpStatusCode.InternalServerError,
        };

        context.Response.StatusCode = statusCode;

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitleForStatusCode(statusCode),
            Detail = _env.IsDevelopment() ? exception.ToString() : exception.Message,
            Instance = context.Request.Path,
            Type = $"https://httpstatuses.com/{statusCode}",
        };

        var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        return context.Response.WriteAsync(json);
    }

    private static string GetTitleForStatusCode(int statusCode) => statusCode switch
    {
        400 => "Yêu cầu không hợp lệ (Bad Request)",
        401 => "Chưa xác thực (Unauthorized)",
        404 => "Không tìm thấy tài nguyên (Not Found)",
        _ => "Lỗi máy chủ nội bộ (Internal Server Error)",
    };
}

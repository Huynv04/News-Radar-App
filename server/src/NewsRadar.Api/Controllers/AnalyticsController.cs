using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly INlpService _nlpService;

    public AnalyticsController(INlpService nlpService)
    {
        _nlpService = nlpService;
    }

    // GET: http://localhost:5275/api/analytics/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _nlpService.GetDashboardAnalyticsAsync();
        return Ok(result);
    }

    // POST: http://localhost:5275/api/analytics/reprocess
    [HttpPost("reprocess")]
    public async Task<IActionResult> ReprocessArticles()
    {
        var processedCount = await _nlpService.ReprocessAllArticlesAsync();
        return Ok(new { message = "Đã chạy NLP & lọc trùng SHA-256 thành công!", totalRemaining = processedCount });
    }
}
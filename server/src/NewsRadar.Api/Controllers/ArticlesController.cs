using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace NewsRadar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleService _articleService;

    public ArticlesController(IArticleService articleService)
    {
        _articleService = articleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetArticles([FromQuery] ArticleFilterParams filter)
    {
        var result = await _articleService.GetArticlesAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetArticleById(Guid id)
    {
        var article = await _articleService.GetArticleByIdAsync(id);
        if (article == null)
            return NotFound(new { message = $"Không tìm thấy bài viết với Id '{id}'" });

        return Ok(article);
    }

    [HttpPost("test-hot-broadcast")]
    public async Task<IActionResult> TestHotBroadcast([FromServices] MediatR.IMediator mediator, [FromQuery] string? title)
    {
        var testEvent = new NewsRadar.Application.Common.Events.HotArticleDetectedEvent
        {
            ArticleId = Guid.NewGuid(),
            Title = string.IsNullOrWhiteSpace(title) ? "Cảnh báo khẩn: Bão số 5 đổi hướng đổ bộ trực tiếp vào miền Trung" : title,
            TrendScore = 98.5,
            SourceName = "VnExpress (Simulated)",
            PublishedAt = DateTime.UtcNow,
        };

        await mediator.Publish(testEvent);
        return Ok(new { message = "Đã phát sóng thông báo Tin Nóng qua SignalR và lưu cache Redis!", payload = testEvent });
    }
    /// <summary>Ghim hoặc Bỏ ghim bài viết lên đầu trang chủ (Chỉ dành cho Admin)</summary>
[Authorize(Roles = "Admin")]
[HttpPatch("{id:guid}/pin")]
public async Task<IActionResult> TogglePin(Guid id, CancellationToken cancellationToken)
{
    try
    {
        var isPinned = await _articleService.TogglePinArticleAsync(id, cancellationToken);
        return Ok(new
        {
            isPinned,
            message = isPinned ? "Đã ghim bài viết lên đầu trang." : "Đã bỏ ghim bài viết."
        });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new { message = ex.Message });
    }
}
/// <summary>Can thiệp thủ công: Cập nhật Danh mục và Sắc thái (Chỉ dành cho Admin)</summary>
[Authorize(Roles = "Admin")]
[HttpPatch("{id:guid}/override")]
public async Task<IActionResult> OverrideMetadata(
    Guid id,
    [FromBody] OverrideArticleDto dto,
    CancellationToken cancellationToken)
{
    try
    {
        var updatedArticle = await _articleService.OverrideArticleMetadataAsync(
            id, dto.Category, dto.SentimentLabel, cancellationToken);
        return Ok(updatedArticle);
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new { message = ex.Message });
    }
}


}
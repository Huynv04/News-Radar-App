using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly IReadingHistoryService _historyService;

    public HistoryController(IReadingHistoryService historyService)
    {
        _historyService = historyService;
    }

    /// <summary>Ghi nhận bài viết người dùng vừa mở đọc</summary>
    [HttpPost("{articleId:guid}")]
    public async Task<IActionResult> RecordRead(Guid articleId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _historyService.RecordReadAsync(userId, articleId, cancellationToken);
        return NoContent();
    }

    /// <summary>Lấy danh sách lịch sử đọc của người dùng hiện tại</summary>
    [HttpGet]
    public async Task<ActionResult<List<ReadingHistoryDto>>> GetHistory([FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var history = await _historyService.GetUserHistoryAsync(userId, limit, cancellationToken);
        return Ok(history);
    }

    /// <summary>Xóa toàn bộ lịch sử đọc</summary>
    [HttpDelete]
    public async Task<IActionResult> ClearHistory(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _historyService.ClearHistoryAsync(userId, cancellationToken);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub")
               ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}

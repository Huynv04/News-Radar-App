using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize] // Tất cả endpoints bookmark đều yêu cầu đăng nhập
public class BookmarksController : ControllerBase
{
    private readonly IBookmarkService _bookmarkService;

    public BookmarksController(IBookmarkService bookmarkService)
    {
        _bookmarkService = bookmarkService;
    }

    /// <summary>Lấy danh sách bài viết đã bookmark của user hiện tại</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<BookmarkDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBookmarks(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var bookmarks = await _bookmarkService.GetUserBookmarksAsync(userId, cancellationToken);
        return Ok(bookmarks);
    }

    /// <summary>Thêm bài viết vào bookmark</summary>
    [HttpPost]
    [ProducesResponseType(typeof(BookmarkDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddBookmark([FromBody] AddBookmarkRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var bookmark = await _bookmarkService.AddBookmarkAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetBookmarks), null, bookmark);
    }

    /// <summary>Xóa bài viết khỏi bookmark (by ArticleId)</summary>
    [HttpDelete("{articleId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveBookmark([FromRoute] Guid articleId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _bookmarkService.RemoveBookmarkAsync(userId, articleId, cancellationToken);
        return NoContent();
    }

    /// <summary>Kiểm tra xem bài viết đã được bookmark chưa</summary>
    [HttpGet("{articleId:guid}/status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> IsBookmarked([FromRoute] Guid articleId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var isBookmarked = await _bookmarkService.IsBookmarkedAsync(userId, articleId, cancellationToken);
        return Ok(new { isBookmarked });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub")
               ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}

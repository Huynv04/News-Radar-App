using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

public interface IBookmarkService
{
    Task<List<BookmarkDto>> GetUserBookmarksAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<BookmarkDto> AddBookmarkAsync(Guid userId, AddBookmarkRequest request, CancellationToken cancellationToken = default);
    Task RemoveBookmarkAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default);
    Task<bool> IsBookmarkedAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default);
}

using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

public interface IReadingHistoryService
{
    Task RecordReadAsync(Guid userId, Guid articleId, CancellationToken cancellationToken = default);
    Task<List<ReadingHistoryDto>> GetUserHistoryAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default);
    Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default);
}

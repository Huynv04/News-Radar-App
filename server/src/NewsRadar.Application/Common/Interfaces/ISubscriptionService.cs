using NewsRadar.Application.Common.DTOs;

namespace NewsRadar.Application.Common.Interfaces;

public interface ISubscriptionService
{
    Task<List<SubscriptionDto>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<SubscriptionDto> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task<SubscriptionDto> UpdateSubscriptionAsync(Guid userId, Guid subscriptionId, UpdateSubscriptionRequest request, CancellationToken cancellationToken = default);
    Task DeleteSubscriptionAsync(Guid userId, Guid subscriptionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy tất cả subscriptions đang active theo keyword để gửi thông báo (dùng cho Background Job).
    /// </summary>
    Task<List<(Guid UserId, string Email, string DisplayName, string Channel, string Keyword)>> GetActiveSubscribersForKeywordAsync(string keyword, CancellationToken cancellationToken = default);

}

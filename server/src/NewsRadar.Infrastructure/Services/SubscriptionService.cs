using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IApplicationDbContext _db;

    public SubscriptionService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<SubscriptionDto>> GetUserSubscriptionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubscriptionDto(
                s.Id,
                s.Keyword,
                s.Category,
                s.Channel,
                s.IsActive,
                s.CreatedAt
            ))
            .ToListAsync(cancellationToken);
    }

    public async Task<SubscriptionDto> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        // Validate channel
        if (request.Channel != "Email" && request.Channel != "InApp")
            throw new ArgumentException("Channel phải là 'Email' hoặc 'InApp'.");

        // Không cho trùng keyword + channel cho cùng user
        var exists = await _db.Subscriptions.AnyAsync(
            s => s.UserId == userId &&
                 s.Keyword.ToLower() == request.Keyword.ToLower() &&
                 s.Channel == request.Channel,
            cancellationToken);

        if (exists)
            throw new InvalidOperationException($"Bạn đã đăng ký theo dõi từ khóa '{request.Keyword}' qua kênh '{request.Channel}' rồi.");

        var subscription = new Subscription
        {
            UserId = userId,
            Keyword = request.Keyword.Trim(),
            Category = request.Category?.Trim(),
            Channel = request.Channel,
            IsActive = true
        };

        _db.Subscriptions.Add(subscription);
        await _db.SaveChangesAsync(cancellationToken);

        return new SubscriptionDto(
            subscription.Id,
            subscription.Keyword,
            subscription.Category,
            subscription.Channel,
            subscription.IsActive,
            subscription.CreatedAt
        );
    }

    public async Task<SubscriptionDto> UpdateSubscriptionAsync(Guid userId, Guid subscriptionId, UpdateSubscriptionRequest request, CancellationToken cancellationToken = default)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Subscription không tồn tại hoặc không thuộc về bạn.");

        subscription.Keyword = request.Keyword.Trim();
        subscription.Category = request.Category?.Trim();
        subscription.Channel = request.Channel;
        subscription.IsActive = request.IsActive;

        await _db.SaveChangesAsync(cancellationToken);

        return new SubscriptionDto(
            subscription.Id,
            subscription.Keyword,
            subscription.Category,
            subscription.Channel,
            subscription.IsActive,
            subscription.CreatedAt
        );
    }

    public async Task DeleteSubscriptionAsync(Guid userId, Guid subscriptionId, CancellationToken cancellationToken = default)
    {
        var subscription = await _db.Subscriptions
            .FirstOrDefaultAsync(s => s.Id == subscriptionId && s.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Subscription không tồn tại hoặc không thuộc về bạn.");

        _db.Subscriptions.Remove(subscription);
        await _db.SaveChangesAsync(cancellationToken);
    }
        public async Task<List<(Guid UserId, string Email, string DisplayName, string Channel, string Keyword)>> GetActiveSubscribersForKeywordAsync(
        string keyword, CancellationToken cancellationToken = default)
    {
        return await _db.Subscriptions
            .Where(s => s.IsActive &&
                        EF.Functions.ILike(keyword, $"%{s.Keyword}%")) // So khớp không phân biệt hoa thường
            .Include(s => s.User)
            .Select(s => ValueTuple.Create(
                s.UserId,               // ⬅️ Bổ sung UserId
                s.User.Email,
                s.User.DisplayName,
                s.Channel,
                s.Keyword
            ))
            .ToListAsync(cancellationToken);
    }

}

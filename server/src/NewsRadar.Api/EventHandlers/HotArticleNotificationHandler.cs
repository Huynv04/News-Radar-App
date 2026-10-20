using MediatR;
using Microsoft.AspNetCore.SignalR;
using NewsRadar.Api.Hubs;
using NewsRadar.Application.Common.Events;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.EventHandlers;

public class HotArticleNotificationHandler : INotificationHandler<HotArticleDetectedEvent>
{
    private readonly IHubContext<NewsHub> _hubContext;
    private readonly IRedisCacheService _cacheService;

    public HotArticleNotificationHandler(IHubContext<NewsHub> hubContext, IRedisCacheService cacheService)
    {
        _hubContext = hubContext;
        _cacheService = cacheService;
    }

    public async Task Handle(HotArticleDetectedEvent notification, CancellationToken cancellationToken)
    {
        // 1. Gửi thông báo Real-time xuống Client qua SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveHotNews", notification, cancellationToken);

        // 2. Lưu vào Redis Cache trong 30 phút
        await _cacheService.SetCachedDataAsync($"hot_article_{notification.ArticleId}", notification, TimeSpan.FromMinutes(30));
    }
}
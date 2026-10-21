using MediatR;
using Microsoft.AspNetCore.SignalR;
using NewsRadar.Api.Hubs;
using NewsRadar.Application.Common.Events;

namespace NewsRadar.Api.EventHandlers;

public class CrawlerCircuitBreakerHandler : INotificationHandler<CrawlerCircuitBreakerEvent>
{
    private readonly IHubContext<NewsHub> _hubContext;

    public CrawlerCircuitBreakerHandler(IHubContext<NewsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(CrawlerCircuitBreakerEvent notification, CancellationToken cancellationToken)
    {
        // Gửi cảnh báo thời gian thực xuống Client qua SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveCrawlerAlert", notification, cancellationToken);
    }
}

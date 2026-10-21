using MediatR;
using Microsoft.AspNetCore.SignalR;
using NewsRadar.Api.Hubs;
using NewsRadar.Application.Common.Events;

namespace NewsRadar.Api.EventHandlers;

public class KeywordArticleNotificationHandler : INotificationHandler<KeywordArticleMatchedEvent>
{
    private readonly IHubContext<NewsHub> _hubContext;

    public KeywordArticleNotificationHandler(IHubContext<NewsHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(KeywordArticleMatchedEvent notification, CancellationToken cancellationToken)
    {
        // 1. Gửi thông báo trực tiếp tới riêng tài khoản có UserId này
        await _hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("ReceiveKeywordAlert", notification, cancellationToken);

        // 2. Đồng thời gửi kèm User target để Client lọc nếu dùng kết nối ẩn danh
        await _hubContext.Clients.All
            .SendAsync("ReceiveKeywordAlertBroadcast", notification, cancellationToken);
    }
}

using Microsoft.AspNetCore.SignalR;

namespace NewsRadar.Api.Hubs;

public class NewsHub : Hub
{
    // Client có thể kết nối tới Hub này để lắng nghe sự kiện "ReceiveHotNews"
}
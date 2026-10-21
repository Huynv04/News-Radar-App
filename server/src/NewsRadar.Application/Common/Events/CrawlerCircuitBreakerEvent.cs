using MediatR;

namespace NewsRadar.Application.Common.Events;

public class CrawlerCircuitBreakerEvent : INotification
{
    public string SourceId { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public int ConsecutiveFailures { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
}

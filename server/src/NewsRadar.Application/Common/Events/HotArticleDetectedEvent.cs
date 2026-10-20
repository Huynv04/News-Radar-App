using MediatR;

namespace NewsRadar.Application.Common.Events;

public class HotArticleDetectedEvent : INotification
{
    public Guid ArticleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public double TrendScore { get; set; }
    public string SourceName { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
}
using MediatR;

namespace NewsRadar.Application.Common.Events;

public class KeywordArticleMatchedEvent : INotification
{
    public Guid UserId { get; set; }
    public string Keyword { get; set; } = string.Empty;
    public Guid ArticleId { get; set; }
    public string ArticleTitle { get; set; } = string.Empty;
    public string ArticleUrl { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
}

namespace NewsRadar.Application.Common.Interfaces;

public interface IEmailNotificationService
{
    Task SendKeywordAlertEmailAsync(
        string recipientEmail,
        string recipientName,
        string keyword,
        string articleTitle,
        string articleUrl,
        string sourceName,
        CancellationToken cancellationToken = default);
}

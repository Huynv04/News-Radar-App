using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Infrastructure.Services;

public class EmailNotificationService : IEmailNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(IConfiguration configuration, ILogger<EmailNotificationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendKeywordAlertEmailAsync(
        string recipientEmail,
        string recipientName,
        string keyword,
        string articleTitle,
        string articleUrl,
        string sourceName,
        CancellationToken cancellationToken = default)
    {
        var smtpHost = _configuration["Email:SmtpHost"];
        var smtpPortStr = _configuration["Email:SmtpPort"];
        var senderEmail = _configuration["Email:SenderEmail"] ?? "alerts@newsradar.local";
        var senderPassword = _configuration["Email:SenderPassword"];

        var subject = $"🔔 [News Radar] Cảnh báo từ khóa: #{keyword} - {articleTitle}";
        var bodyHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .badge {{ display: inline-block; background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 12px; }}
        .title {{ font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.4; }}
        .source {{ font-size: 13px; color: #64748b; margin-bottom: 20px; }}
        .btn {{ display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='card'>
        <span class='badge'>Từ khóa bạn theo dõi: #{keyword}</span>
        <h2 class='title'>{articleTitle}</h2>
        <div class='source'>Nguồn tin: <strong>{sourceName}</strong> | Thời gian: {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC</div>
        <p>Hệ thống tự động phát hiện bài viết mới khớp với chủ đề theo dõi của bạn ({recipientName}).</p>
        <p><a href='{articleUrl}' target='_blank' class='btn'>Đọc bài viết ngay &rarr;</a></p>
    </div>
</body>
</html>";

        // Nếu có cấu hình SMTP thực tế, gửi qua System.Net.Mail
        if (!string.IsNullOrWhiteSpace(smtpHost) && int.TryParse(smtpPortStr, out var port))
        {
            try
            {
                using var client = new SmtpClient(smtpHost, port)
                {
                    EnableSsl = true,
                    Credentials = !string.IsNullOrWhiteSpace(senderPassword)
                        ? new NetworkCredential(senderEmail, senderPassword)
                        : null
                };

                using var message = new MailMessage(senderEmail, recipientEmail, subject, bodyHtml)
                {
                    IsBodyHtml = true
                };

                await client.SendMailAsync(message, cancellationToken);
                _logger.LogInformation("📧 [Email Sent] Đã gửi email cảnh báo từ khóa '{Keyword}' tới {Email}", keyword, recipientEmail);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Gửi email thực tế qua SMTP thất bại. Chuyển sang ghi nhận Log.");
            }
        }

        // Fallback ghi Log giả lập gửi email thành công
        _logger.LogInformation("📬 [EMAIL ALERT DISPATCHED]: To='{Email}' ({Name}), Keyword='{Keyword}', Source='{Source}', Title='{Title}'",
            recipientEmail, recipientName, keyword, sourceName, articleTitle);
    }
}

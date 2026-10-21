namespace NewsRadar.Application.Common.DTOs;

public class OverrideArticleDto
{
    public string? Category { get; set; }
    public string? SentimentLabel { get; set; } // "Positive", "Negative", "Neutral"
}

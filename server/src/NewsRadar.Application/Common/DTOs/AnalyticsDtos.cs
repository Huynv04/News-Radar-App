namespace NewsRadar.Application.Common.DTOs;

public class SentimentStatDto
{
    public string Sentiment { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CategoryStatDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class HotKeywordDto
{
    public string Keyword { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardAnalyticsDto
{
    public int TotalArticles { get; set; }
    public List<SentimentStatDto> SentimentStats { get; set; } = new();
    public List<CategoryStatDto> CategoryStats { get; set; } = new();
    public List<HotKeywordDto> HotKeywords24h { get; set; } = new();
    public List<ArticleDto> TopTrendingArticles { get; set; } = new();
}
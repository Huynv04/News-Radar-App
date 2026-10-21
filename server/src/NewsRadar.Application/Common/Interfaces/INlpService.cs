namespace NewsRadar.Application.Common.Interfaces;

/// <summary>
/// Pure NLP service - khong truy cap DB, khong co side effects.
/// Co the dang ky Singleton.
/// </summary>
public interface INlpService
{
    string ComputeSha256Hash(string rawText);
    (string Label, double Score) AnalyzeSentiment(string title, string sapo);
    double CalculateTrendScore(string title, string sapo, DateTime publishedAt);
    string DetermineCategory(string title, string sapo);
    IEnumerable<string> ExtractBigrams(string text);
    double CalculateCosineSimilarity(string text1, string text2);
}


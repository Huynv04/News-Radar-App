using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Infrastructure.Services;

/// <summary>
/// Dịch vụ NLP thuần túy: Xử lý ngôn ngữ tự nhiên, tính điểm Trend, phân tích sắc thái,
/// phân loại danh mục tự động và tính độ tương đồng văn bản Cosine Similarity.
/// Hoàn toàn Stateless, an toàn Thread-safe, có thể đăng ký Singleton trong DI.
/// </summary>
public class NlpService : INlpService
{
    // Từ điển Sắc thái Tích cực (Positive)
    private static readonly string[] PositiveWords =
    [
        "tăng trưởng", "đột phá", "thành công", "kỷ lục", "khởi sắc", "hỗ trợ",
        "khen thưởng", "an toàn", "thắng lợi", "phục hồi", "tích cực", "hiện đại",
        "giải cứu", "khánh thành", "hợp tác", "vinh danh", "ưu đãi", "phát triển",
        "hạnh phúc", "miễn phí", "chiến thắng", "vượt chỉ tiêu", "ấn tượng"
    ];

    // Từ điển Sắc thái Tiêu cực (Negative)
    private static readonly string[] NegativeWords =
    [
        "tai nạn", "tử vong", "thiệt hại", "sạt lở", "lừa đảo", "khủng hoảng",
        "suy thoái", "bắt giữ", "khởi tố", "ngập lụt", "cháy", "dịch bệnh",
        "bão", "lũ", "thương vong", "vi phạm", "ô nhiễm", "kẹt xe", "buôn lậu",
        "tham nhũng", "nạn nhân", "cảnh báo", "khẩn cấp", "mất tích", "giảm mạnh"
    ];

    // Từ khóa Tin nóng cộng điểm Trend
    private static readonly string[] HotBoostWords =
    [
        "khẩn", "nóng", "kỷ lục", "đột phá", "bão", "khởi tố", "sạt lở",
        "giá vàng", "chứng khoán", "ai", "bán dẫn", "cao tốc", "sân bay", "chính phủ"
    ];

    // Từ dừng (Stopwords) loại bỏ khi trích xuất Tag Cloud & Cosine Similarity
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "của", "và", "các", "những", "trong", "được", "cho", "với", "không", "người",
        "này", "đã", "đang", "sẽ", "một", "nhiều", "trên", "về", "tại", "theo", "từ",
        "khi", "đến", "vào", "ra", "có", "là", "để", "việc", "sau", "trước", "cùng",
        "như", "do", "vì", "bị", "bởi", "hơn", "nhất", "cũng", "vẫn", "chỉ", "rất"
    };

    // Bản đồ phân loại danh mục tự động dựa trên từ khóa cốt lõi
    private static readonly Dictionary<string, string[]> CategoryKeywords = new()
    {
        ["Kinh tế"] =
        [
            "kinh tế", "tài chính", "ngân hàng", "chứng khoán", "bất động sản", "doanh nghiệp",
            "giá vàng", "lãi suất", "lạm phát", "xuất khẩu", "nhập khẩu", "thị trường", "gdp", "usd"
        ],
        ["Công nghệ"] =
        [
            "công nghệ", "trí tuệ nhân tạo", "ai", "bán dẫn", "vi mạch", "phần mềm", "chuyển đổi số",
            "smartphone", "robot", "internet", "viễn thông", "chíp", "apple", "google", "meta", "nvidia"
        ],
        ["Thể thao"] =
        [
            "thể thao", "bóng đá", "v-league", "ngoại hạng anh", "champions league", "u23", "world cup",
            "cầu thủ", "huấn luyện viên", "vô địch", "huy chương", "sea games", "tennis", "olympic"
        ],
        ["Giải trí"] =
        [
            "giải trí", "showbiz", "ca sĩ", "diễn viên", "điện ảnh", "phim", "âm nhạc", "hoa hậu",
            "nghệ sĩ", "concert", "scandal", "album", "bài hát"
        ],
        ["Thế giới"] =
        [
            "thế giới", "quốc tế", "ngoại giao", "tổng thống", "mỹ", "trung quốc", "nga", "ukraine",
            "liên hợp quốc", "nato", "asean", "eu", "bầu cử"
        ],
        ["Sức khỏe"] =
        [
            "sức khỏe", "y tế", "bệnh viện", "bác sĩ", "dược phẩm", "vắc xin", "điều trị", "ung thư",
            "dịch bệnh", "thuốc", "bảo hiểm y tế"
        ],
        ["Giáo dục"] =
        [
            "giáo dục", "đại học", "học sinh", "sinh viên", "giáo viên", "học phí", "điểm thi",
            "tốt nghiệp", "học bổng", "trường học", "bộ gd-đt"
        ],
        ["Thời sự"] =
        [
            "thời sự", "chính phủ", "thủ tướng", "quốc hội", "chủ tịch", "bộ trưởng", "ubnd",
            "giao thông", "cao tốc", "sạt lở", "ngập lụt", "công an", "thanh tra", "khởi tố"
        ]
    };

    public NlpService()
    {
    }

    /// <summary>
    /// Tạo mã SHA-256 đã chuẩn hóa khoảng trắng và chữ thường.
    /// </summary>
    public string ComputeSha256Hash(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return string.Empty;

        var normalized = Regex.Replace(rawText.Trim().ToLowerInvariant(), @"\s+", " ");
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// Phân tích cảm xúc bài viết (Positive / Negative / Neutral) kèm điểm từ -1.0 đến +1.0.
    /// </summary>
    public (string Label, double Score) AnalyzeSentiment(string title, string sapo)
    {
        var fullText = $"{title} {sapo}".ToLowerInvariant();
        int posCount = 0;
        int negCount = 0;

        foreach (var word in PositiveWords)
        {
            if (fullText.Contains(word)) posCount++;
        }

        foreach (var word in NegativeWords)
        {
            if (fullText.Contains(word)) negCount++;
        }

        int diff = posCount - negCount;
        double score = Math.Clamp(diff * 0.25, -1.0, 1.0);

        if (score > 0) return ("Positive", Math.Round(score, 2));
        if (score < 0) return ("Negative", Math.Round(score, 2));
        return ("Neutral", 0);
    }

    /// <summary>
    /// Tính toán điểm nóng Trend Score với công thức suy giảm thời gian (Time-decay).
    /// </summary>
    public double CalculateTrendScore(string title, string sapo, DateTime publishedAt)
    {
        var fullText = $"{title} {sapo}".ToLowerInvariant();
        double baseWeight = 100.0;

        foreach (var boost in HotBoostWords)
        {
            if (fullText.Contains(boost)) baseWeight += 35.0;
        }

        var hoursSincePublished = Math.Max(0, (DateTime.UtcNow - publishedAt.ToUniversalTime()).TotalHours);
        double gravity = Math.Pow(hoursSincePublished + 2.0, 1.5);
        double trendScore = baseWeight / gravity;

        return Math.Round(trendScore, 2);
    }

    /// <summary>
    /// Tự động phân loại danh mục (Auto-Categorization) dựa trên đối chiếu từ khóa với trọng số.
    /// </summary>
    public string DetermineCategory(string title, string sapo)
    {
        var fullText = $"{title} {sapo}".ToLowerInvariant();
        string bestCategory = "Thời sự";
        int maxMatches = 0;

        foreach (var (category, keywords) in CategoryKeywords)
        {
            int matches = 0;
            foreach (var kw in keywords)
            {
                if (fullText.Contains(kw))
                {
                    // Từ khóa trùng trong tiêu đề được tính trọng số gấp đôi
                    matches += title.Contains(kw, StringComparison.OrdinalIgnoreCase) ? 2 : 1;
                }
            }

            if (matches > maxMatches)
            {
                maxMatches = matches;
                bestCategory = category;
            }
        }

        return bestCategory;
    }

    /// <summary>
    /// Bóc tách cụm 2 từ (Bigrams) đã lọc Stopwords phục vụ Tag Cloud từ khóa nóng.
    /// </summary>
    public IEnumerable<string> ExtractBigrams(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return [];

        var cleanText = Regex.Replace(text.ToLowerInvariant(), @"[^\p{L}\p{N}\s]", " ");
        var tokens = cleanText.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                              .Where(w => w.Length > 2 && !StopWords.Contains(w))
                              .ToArray();

        var result = new List<string>();
        for (int i = 0; i < tokens.Length - 1; i++)
        {
            result.Add($"{tokens[i]} {tokens[i + 1]}");
        }

        return result;
    }

    /// <summary>
    /// Tính độ tương đồng văn bản Cosine Similarity (0.0 -> 1.0) giữa 2 đoạn văn
    /// để phát hiện các bài viết cùng đưa tin về một sự kiện từ nhiều đầu báo khác nhau.
    /// </summary>
    public double CalculateCosineSimilarity(string text1, string text2)
    {
        if (string.IsNullOrWhiteSpace(text1) || string.IsNullOrWhiteSpace(text2)) return 0.0;

        var tokens1 = Tokenize(text1);
        var tokens2 = Tokenize(text2);

        if (tokens1.Count == 0 || tokens2.Count == 0) return 0.0;

        var freq1 = GetTermFrequencies(tokens1);
        var freq2 = GetTermFrequencies(tokens2);

        var allWords = new HashSet<string>(freq1.Keys.Concat(freq2.Keys));

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        foreach (var word in allWords)
        {
            freq1.TryGetValue(word, out double count1);
            freq2.TryGetValue(word, out double count2);

            dotProduct += count1 * count2;
            norm1 += count1 * count1;
            norm2 += count2 * count2;
        }

        if (norm1 == 0 || norm2 == 0) return 0.0;

        double similarity = dotProduct / (Math.Sqrt(norm1) * Math.Sqrt(norm2));
        return Math.Round(Math.Clamp(similarity, 0.0, 1.0), 4);
    }

    private static List<string> Tokenize(string text)
    {
        var clean = Regex.Replace(text.ToLowerInvariant(), @"[^\p{L}\p{N}\s]", " ");
        return clean.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(w => w.Length > 1 && !StopWords.Contains(w))
                    .ToList();
    }

    private static Dictionary<string, double> GetTermFrequencies(List<string> tokens)
    {
        var dict = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        foreach (var token in tokens)
        {
            dict[token] = dict.GetValueOrDefault(token) + 1.0;
        }
        return dict;
    }
}
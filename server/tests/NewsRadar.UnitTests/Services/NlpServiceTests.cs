using FluentAssertions;
using NewsRadar.Infrastructure.Services;

namespace NewsRadar.UnitTests.Services;

/// <summary>
/// Unit Tests cho NlpService — kiểm tra từng hàm NLP độc lập, không cần DB hay network.
/// Demo 2 test cases: AnalyzeSentiment và CalculateTrendScore.
/// </summary>
public class NlpServiceTests
{
    private readonly NlpService _sut; // System Under Test

    public NlpServiceTests()
    {
        _sut = new NlpService();
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 1: AnalyzeSentiment — từ khóa tích cực → Positive
    // ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Kinh tế tăng trưởng mạnh mẽ", "Đạt kỷ lục mới trong năm 2024", "Positive")]
    [InlineData("Tai nạn thảm khốc trên cao tốc", "Nhiều người tử vong, thiệt hại lớn", "Negative")]
    // "hợp tác" là positive word trong từ điển NlpService → kết quả thực tế là Positive
    [InlineData("Hội nghị diễn ra tại Hà Nội", "Các bên đã ký kết hợp tác chiến lược quan trọng", "Positive")]
    public void AnalyzeSentiment_WithVariousContent_ReturnsCorrectLabel(
        string title, string sapo, string expectedLabel)
    {
        // Act
        var (label, score) = _sut.AnalyzeSentiment(title, sapo);

        // Assert
        label.Should().Be(expectedLabel,
            because: $"title '{title}' nên được phân loại là {expectedLabel}");

        // Score hợp lệ trong phạm vi [-1, 1]
        score.Should().BeInRange(-1.0, 1.0,
            because: "sentiment score phải nằm trong khoảng [-1.0, 1.0]");
    }

    [Fact]
    public void AnalyzeSentiment_WithEmptyInput_ReturnsNeutralWithZeroScore()
    {
        // Act
        var (label, score) = _sut.AnalyzeSentiment(string.Empty, string.Empty);

        // Assert
        label.Should().Be("Neutral",
            because: "chuỗi rỗng không chứa từ khóa nào → phải trả về Neutral");
        score.Should().Be(0.0,
            because: "không có từ khóa nào khớp → score phải là 0");
    }

    // ─────────────────────────────────────────────────────────────
    // Test Case 2: CalculateTrendScore — bài mới hơn có score cao hơn
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void CalculateTrendScore_NewerArticle_HasHigherScoreThanOlderOne()
    {
        // Arrange
        var title = "Thông tin thị trường hôm nay";
        var sapo = "Các diễn biến mới nhất";

        var publishedJustNow = DateTime.UtcNow.AddMinutes(-5);
        var publishedYesterday = DateTime.UtcNow.AddHours(-20);

        // Act
        var scoreNew = _sut.CalculateTrendScore(title, sapo, publishedJustNow);
        var scoreOld = _sut.CalculateTrendScore(title, sapo, publishedYesterday);

        // Assert
        scoreNew.Should().BeGreaterThan(scoreOld,
            because: "bài vừa đăng phải có TrendScore cao hơn bài đăng hôm qua (time-decay)");
    }

    [Fact]
    public void CalculateTrendScore_WithMultipleSources_IncreasesScore()
    {
        // Arrange
        var title = "Giá vàng đạt đỉnh lịch sử";
        var sapo = "Cập nhật mới nhất";
        var publishedAt = DateTime.UtcNow.AddMinutes(-30);

        // Act — 1 báo đưa tin vs 4 báo cùng đưa tin (clusterCount)
        var scoreSingle  = _sut.CalculateTrendScore(title, sapo, publishedAt, clusterCount: 1);
        var scoreCluster = _sut.CalculateTrendScore(title, sapo, publishedAt, clusterCount: 4);

        // Assert
        scoreCluster.Should().BeGreaterThan(scoreSingle,
            because: "4 báo cùng đưa tin về 1 sự kiện → phải có TrendScore cao hơn 1 báo đơn lẻ");
    }

    // ─────────────────────────────────────────────────────────────
    // Bonus: CalculateCosineSimilarity — 2 câu giống nhau → ≈1.0
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void CalculateCosineSimilarity_IdenticalTexts_ReturnsOne()
    {
        var text = "Bão số 3 đổ bộ vào miền Trung gây thiệt hại lớn";

        var similarity = _sut.CalculateCosineSimilarity(text, text);

        similarity.Should().BeApproximately(1.0, precision: 0.001,
            because: "2 văn bản hoàn toàn giống nhau phải có cosine similarity = 1.0");
    }

    [Fact]
    public void CalculateCosineSimilarity_CompletelyDifferentTexts_ReturnsLowValue()
    {
        var text1 = "Giá vàng tăng mạnh trên thị trường quốc tế";
        var text2 = "Đội tuyển bóng đá Việt Nam thắng trận";

        var similarity = _sut.CalculateCosineSimilarity(text1, text2);

        similarity.Should().BeLessThan(0.3,
            because: "2 bài viết về chủ đề hoàn toàn khác nhau phải có similarity thấp");
    }

    // ─────────────────────────────────────────────────────────────
    // Bonus: DetermineCategory — phân loại danh mục tự động
    // ─────────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Chứng khoán lao dốc, GDP quý 3 sụt giảm", "Kinh tế")]
    [InlineData("Apple ra mắt chip AI mới, robot thế hệ tiếp theo", "Công nghệ")]
    [InlineData("V-League vòng 20: Hà Nội FC thắng 3-0", "Thể thao")]
    [InlineData("Hoa hậu Việt Nam 2024 đăng quang", "Giải trí")]
    public void DetermineCategory_WithDomainKeywords_ReturnsCorrectCategory(
        string title, string expectedCategory)
    {
        var category = _sut.DetermineCategory(title, sapo: string.Empty);

        category.Should().Be(expectedCategory,
            because: $"title '{title}' chứa từ khóa thuộc danh mục {expectedCategory}");
    }

    // ─────────────────────────────────────────────────────────────
    // ComputeSha256Hash Tests (Deduplication)
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void ComputeSha256Hash_NormalizesWhitespaceAndCase_ProducesIdenticalHash()
    {
        // Arrange: 2 chuỗi nội dung giống nhau nhưng khác chữ hoa/thường và khoảng trắng thừa
        var text1 = "  Bão Số 5 Đổ Bộ Vào Miền Trung  ";
        var text2 = "bão  số  5  đổ bộ   vào miền trung";

        // Act
        var hash1 = _sut.ComputeSha256Hash(text1);
        var hash2 = _sut.ComputeSha256Hash(text2);

        // Assert
        hash1.Should().NotBeNullOrEmpty();
        hash1.Length.Should().Be(64, because: "mã SHA-256 dạng Hex phải gồm đúng 64 ký tự");
        hash1.Should().Be(hash2, because: "hàm phải chuẩn hóa khoảng trắng và lowercase để chống trùng lặp bài viết");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ComputeSha256Hash_WithEmptyOrWhitespace_ReturnsEmptyString(string? input)
    {
        // Act
        var hash = _sut.ComputeSha256Hash(input!);

        // Assert
        hash.Should().BeEmpty(because: "chuỗi rỗng hoặc chỉ toàn khoảng trắng không được tạo hash");
    }

    // ─────────────────────────────────────────────────────────────
    // ExtractBigrams Tests (Tag Cloud & NLP Filtering)
    // ─────────────────────────────────────────────────────────────

    [Fact]
    public void ExtractBigrams_ValidText_FiltersStopWordsAndExtractsPairs()
    {
        // Arrange
        var text = "Thị trường chứng khoán Việt Nam khởi sắc mạnh mẽ";

        // Act
        var bigrams = _sut.ExtractBigrams(text).ToList();

        // Assert
        bigrams.Should().NotBeEmpty();
        bigrams.Should().Contain("thị trường", because: "'thị' và 'trường' là 2 từ có nghĩa liền kề");
        bigrams.Should().Contain("chứng khoán", because: "'chứng khoán' là cụm từ chuyên môn hợp lệ");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("và do bởi cùng như")] // Toàn bộ là stop words
    public void ExtractBigrams_WithEmptyOrOnlyStopwords_ReturnsEmptyList(string input)
    {
        // Act
        var bigrams = _sut.ExtractBigrams(input).ToList();

        // Assert
        bigrams.Should().BeEmpty(because: "văn bản rỗng hoặc chỉ chứa stop words thì không thể trích xuất bigram");
    }
}

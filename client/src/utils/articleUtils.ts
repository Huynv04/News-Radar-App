/**
 * Các hàm tiện ích phục vụ nghiệp vụ hiển thị tin tức, cảm xúc và xu hướng.
 */

export interface SentimentMeta {
  label: string;
  icon: string;
  className: string;
}

/**
 * Kiểm tra bài viết có đạt ngưỡng Tin Nóng (HOT) hay không.
 * Điều kiện: TrendScore >= 45 hoặc tiêu đề chứa từ khóa "khẩn" / "nóng".
 */
export function isHotArticle(
  trendScore?: number | null,
  title?: string | null
): boolean {
  if (typeof trendScore === 'number' && trendScore >= 45) {
    return true;
  }

  if (title) {
    const lower = title.toLowerCase();
    if (lower.includes('khẩn') || lower.includes('nóng')) {
      return true;
    }
  }

  return false;
}

/**
 * Trả về thông tin hiển thị (nhãn tiếng Việt, icon, class CSS) cho từng loại Sắc thái (Sentiment).
 */
export function getSentimentMeta(sentimentLabel?: string | null): SentimentMeta {
  switch (sentimentLabel) {
    case 'Positive':
      return {
        label: 'Tích cực',
        icon: '🟢',
        className: 'sentiment-positive',
      };
    case 'Negative':
      return {
        label: 'Tiêu cực',
        icon: '🔴',
        className: 'sentiment-negative',
      };
    case 'Neutral':
    default:
      return {
        label: 'Trung lập',
        icon: '⚪',
        className: 'sentiment-neutral',
      };
  }
}

/**
 * Ước lượng thời gian đọc bài báo (tính theo phút) cho chế độ Reader Mode.
 * Giả định tốc độ đọc trung bình là 200 từ/phút (chuẩn tiếng Việt).
 */
export function estimateReadingTime(
  content?: string | null,
  wordsPerMinute: number = 200
): number {
  if (!content || !content.trim()) return 0;

  // Đếm số từ bằng cách tách theo khoảng trắng
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return Math.max(1, minutes);
}


import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatRelativeTime,
  decodeHtmlEntities,
  truncateText,
  isHotArticle,
  getSentimentMeta,
  estimateReadingTime,
} from '../utils';

// ─────────────────────────────────────────────────────────────
// 1. dateUtils Tests
// ─────────────────────────────────────────────────────────────
describe('dateUtils', () => {
  it('formatDate formats valid ISO dates into Vietnamese locale format', () => {
    const isoString = '2026-10-29T10:30:00.000Z';
    const formatted = formatDate(isoString);

    expect(formatted).not.toBe('');
    // Chứa thông tin năm 2026
    expect(formatted).toContain('2026');
  });

  it('formatDate returns empty string for empty or invalid date inputs', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('invalid-date-string')).toBe('');
  });

  it('formatRelativeTime calculates human-friendly relative time intervals correctly', () => {
    const now = new Date('2026-10-29T14:00:00.000Z');

    // Dưới 1 phút -> "Vừa xong"
    const justNow = new Date('2026-10-29T13:59:30.000Z');
    expect(formatRelativeTime(justNow, now)).toBe('Vừa xong');

    // 15 phút trước -> "15 phút trước"
    const minutesAgo = new Date('2026-10-29T13:45:00.000Z');
    expect(formatRelativeTime(minutesAgo, now)).toBe('15 phút trước');

    // 3 giờ trước -> "3 giờ trước"
    const hoursAgo = new Date('2026-10-29T11:00:00.000Z');
    expect(formatRelativeTime(hoursAgo, now)).toBe('3 giờ trước');

    // 2 ngày trước -> "2 ngày trước"
    const daysAgo = new Date('2026-10-27T14:00:00.000Z');
    expect(formatRelativeTime(daysAgo, now)).toBe('2 ngày trước');

    // Lâu hơn 7 ngày -> Trả về ngày chuẩn
    const oldDate = new Date('2026-10-01T14:00:00.000Z');
    const oldFormatted = formatRelativeTime(oldDate, now);
    expect(oldFormatted).not.toContain('ngày trước');
  });
});

// ─────────────────────────────────────────────────────────────
// 2. textUtils Tests
// ─────────────────────────────────────────────────────────────
describe('textUtils', () => {
  it('decodeHtmlEntities decodes common HTML entities to plain text', () => {
    const input = '&quot;Hà Nội&quot; &amp; TP.HCM: Giá vàng tăng &gt; 90 triệu&#39;';
    const decoded = decodeHtmlEntities(input);

    expect(decoded).toBe('"Hà Nội" & TP.HCM: Giá vàng tăng > 90 triệu\'');
  });

  it('decodeHtmlEntities handles empty, null or already clean strings', () => {
    expect(decodeHtmlEntities(null)).toBe('');
    expect(decodeHtmlEntities('')).toBe('');
    expect(decodeHtmlEntities('Văn bản thuần')).toBe('Văn bản thuần');
  });

  it('truncateText trims text longer than maxLength and appends suffix', () => {
    const longText = 'Đây là một đoạn tiêu đề bài báo rất dài vượt quá giới hạn hiển thị của giao diện';
    const truncated = truncateText(longText, 30);

    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(33); // 30 chars + '...'
  });

  it('truncateText preserves short strings without appending suffix', () => {
    const shortText = 'Tiêu đề ngắn';
    expect(truncateText(shortText, 50)).toBe(shortText);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. articleUtils Tests
// ─────────────────────────────────────────────────────────────
describe('articleUtils', () => {
  it('isHotArticle identifies hot articles by score threshold (>= 45)', () => {
    expect(isHotArticle(45, 'Tiêu đề bình thường')).toBe(true);
    expect(isHotArticle(60, 'Tin kinh tế')).toBe(true);
    expect(isHotArticle(30, 'Tin kinh tế')).toBe(false);
  });

  it('isHotArticle identifies hot articles by urgent keywords even if score is low', () => {
    // Tiêu đề chứa "khẩn" hoặc "nóng"
    expect(isHotArticle(10, 'Thông báo KHẨN về bão lũ')).toBe(true);
    expect(isHotArticle(20, 'Tin NÓNG: Giá vàng sáng nay')).toBe(true);
    expect(isHotArticle(null, 'Tin bình thường')).toBe(false);
  });

  it('getSentimentMeta maps sentiment labels to correct UI attributes', () => {
    const pos = getSentimentMeta('Positive');
    expect(pos.label).toBe('Tích cực');
    expect(pos.icon).toBe('🟢');
    expect(pos.className).toBe('sentiment-positive');

    const neg = getSentimentMeta('Negative');
    expect(neg.label).toBe('Tiêu cực');
    expect(neg.icon).toBe('🔴');
    expect(neg.className).toBe('sentiment-negative');

    const neu = getSentimentMeta('Neutral');
    expect(neu.label).toBe('Trung lập');
    expect(neu.icon).toBe('⚪');
    expect(neu.className).toBe('sentiment-neutral');
  });

  it('estimateReadingTime calculates reading duration based on word count', () => {
    // Nội dung rỗng -> 0 phút
    expect(estimateReadingTime('')).toBe(0);
    expect(estimateReadingTime(null)).toBe(0);

    // Bài ngắn (50 từ) -> Tối thiểu 1 phút
    const shortContent = 'từ '.repeat(50);
    expect(estimateReadingTime(shortContent)).toBe(1);

    // Bài dài (~450 từ với tốc độ 200 từ/phút) -> 3 phút
    const longContent = 'từ '.repeat(450);
    expect(estimateReadingTime(longContent, 200)).toBe(3);
  });
});


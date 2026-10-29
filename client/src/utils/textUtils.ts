/**
 * Các hàm tiện ích xử lý chuỗi và làm sạch văn bản bài báo.
 */

/**
 * Giải mã các ký tự HTML entities thành văn bản thuần.
 * Ví dụ: "&quot;Hà Nội&quot; &amp; TP.HCM" -> '"Hà Nội" & TP.HCM'
 */
export function decodeHtmlEntities(text?: string | null): string {
  if (!text) return '';

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return doc.documentElement.textContent || text;
    }
  } catch {
    // Fallback nếu môi trường không có DOMParser
  }

  // Fallback regex thay thế nhanh các entities phổ biến
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Cắt ngắn văn bản theo độ dài tối đa kèm hậu tố (mặc định "...").
 */
export function truncateText(
  text?: string | null,
  maxLength: number = 100,
  suffix: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength).trimEnd() + suffix;
}


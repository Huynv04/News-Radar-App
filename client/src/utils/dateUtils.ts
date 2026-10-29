/**
 * Các hàm tiện ích xử lý và định dạng ngày giờ cho News Radar.
 */

/**
 * Định dạng ngày giờ chuẩn tiếng Việt (vi-VN).
 * Ví dụ: "29/10/2026 14:30"
 */
export function formatDate(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options,
    };

    return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(date);
  } catch {
    return typeof dateInput === 'string' ? dateInput : '';
  }
}

/**
 * Hiển thị thời gian tương đối kiểu báo chí:
 * - Dưới 1 phút: "Vừa xong"
 * - Dưới 60 phút: "X phút trước"
 * - Dưới 24 giờ: "X giờ trước"
 * - Dưới 7 ngày: "X ngày trước"
 * - Lâu hơn: hiển thị ngày chuẩn dd/MM/yyyy
 */
export function formatRelativeTime(
  dateInput?: string | Date | null,
  baseDate: Date = new Date()
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const diffMs = baseDate.getTime() - date.getTime();

  // Nếu bài viết có ngày tương lai (sai lệch múi giờ nhẹ)
  if (diffMs < 0) return 'Vừa xong';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDate(date, { dateStyle: 'short' });
}


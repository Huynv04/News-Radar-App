import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArticleCard } from '../features/articles/components/ArticleCard/ArticleCard';
import type { Article } from '../types/article';

// Mock AuthProvider — ArticleCard dùng useAuth() để kiểm tra Admin
vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}));

// Mock articleApi — không gọi API thật trong unit test
vi.mock('../../features/articles/api/articleApi', () => ({
  articleApi: {
    togglePin: vi.fn(),
    overrideMetadata: vi.fn(),
  },
}));

// ─── Dữ liệu mẫu ────────────────────────────────────────────────
const mockArticle: Article = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  title: 'Giá vàng đạt kỷ lục mới trong phiên giao dịch sáng nay',
  sapo: 'Thị trường vàng trong nước ghi nhận mức tăng mạnh nhất trong 5 năm qua.',
  url: 'https://vnexpress.net/bai-viet-mau',
  category: 'Kinh tế',
  sentimentLabel: 'Positive',
  sentimentScore: 0.75,
  trendScore: 62.5,
  publishedAt: new Date().toISOString(),
  crawledAt: new Date().toISOString(),
  crawlerSourceId: 'vnexpress',
  crawlerSourceName: 'VnExpress',
  contentHash: 'abc123',
  isPinned: false,
  author: 'Nguyễn Văn A',
  imageUrl: 'https://example.com/image.jpg',
  clusterCount: 3,
  clusterId: undefined,
  content: undefined,
};

// ─────────────────────────────────────────────────────────────────
// Test Case 1: ArticleCard render đúng thông tin bài viết
// ─────────────────────────────────────────────────────────────────
describe('ArticleCard', () => {
  it('renders article title, sapo, source name and category correctly', () => {
    render(<ArticleCard article={mockArticle} />);

    // Tiêu đề phải hiển thị
    expect(screen.getByText(mockArticle.title)).toBeDefined();

    // Sapo phải hiển thị
    expect(screen.getByText(mockArticle.sapo)).toBeDefined();

    // Tên nguồn báo phải hiển thị
    expect(screen.getByText('VnExpress')).toBeDefined();

    // Danh mục phải hiển thị
    expect(screen.getByText('Kinh tế')).toBeDefined();
  });

  it('shows HOT badge when trendScore >= 45', () => {
    // mockArticle.trendScore = 62.5 → phải là HOT
    render(<ArticleCard article={mockArticle} />);

    // Badge HOT phải xuất hiện trong DOM
    const hotBadge = screen.getByText(/Hot/i);
    expect(hotBadge).toBeDefined();
  });

  it('shows cluster badge when clusterCount > 1', () => {
    // mockArticle.clusterCount = 3
    render(<ArticleCard article={mockArticle} />);

    const clusterBadge = screen.getByText(/3.*báo.*đưa tin/i);
    expect(clusterBadge).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 2: Admin controls KHÔNG hiển thị với user thường
  // ─────────────────────────────────────────────────────────────
  it('does NOT show Pin and Override buttons for non-admin users', () => {
    // useAuth mock trả về isAuthenticated: false → không phải admin
    render(<ArticleCard article={mockArticle} />);

    // Nút Ghim không được có trong DOM
    expect(screen.queryByTitle(/ghim bài viết/i)).toBeNull();

    // Nút edit metadata không được có trong DOM
    expect(screen.queryByText(/Sửa NLP/i)).toBeNull();
  });

  it('calls onOpenReader callback when Reader Mode button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenReader = vi.fn();

    render(<ArticleCard article={mockArticle} onOpenReader={onOpenReader} />);

    const readerButton = screen.getByText(/Đọc nhanh/i);
    await user.click(readerButton);

    // Callback phải được gọi đúng 1 lần với bài viết
    expect(onOpenReader).toHaveBeenCalledTimes(1);
    expect(onOpenReader).toHaveBeenCalledWith(mockArticle);
  });
});


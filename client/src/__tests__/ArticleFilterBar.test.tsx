import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArticleFilterBar } from '../features/articles/components/ArticleFilterBar/ArticleFilterBar';
import type { ArticleFilterBarProps, SourceOption } from '../features/articles/components/ArticleFilterBar/ArticleFilterBar';

describe('ArticleFilterBar', () => {
  const mockSources: SourceOption[] = [
    { id: 'vnexpress', name: 'VnExpress' },
    { id: 'tuoitre', name: 'Tuổi Trẻ' },
    { id: 'thanhnien', name: 'Thanh Niên' },
  ];

  const defaultProps: ArticleFilterBarProps = {
    selectedCategory: 'all',
    onSelectCategory: vi.fn(),
    selectedSentiment: '',
    onSelectSentiment: vi.fn(),
    selectedSource: '',
    onSelectSource: vi.fn(),
    searchKeyword: '',
    onSearchChange: vi.fn(),
    onSearchSubmit: vi.fn((e) => e.preventDefault()),
    onClearSearch: vi.fn(),
    sources: mockSources,
    timeRange: 'all',
    onSelectTimeRange: vi.fn(),
    customFromDate: '',
    onCustomFromDateChange: vi.fn(),
    customToDate: '',
    onCustomToDateChange: vi.fn(),
  };

  // ─────────────────────────────────────────────────────────────
  // Test Case 1: Render các thành phần cơ bản & trạng thái ban đầu
  // ─────────────────────────────────────────────────────────────
  it('renders all category pills and active category correctly', () => {
    render(<ArticleFilterBar {...defaultProps} selectedCategory="Kinh tế" />);

    // Phải render nút "Tất cả" (ở cả thanh danh mục và thanh thời gian)
    const allButtons = screen.getAllByRole('button', { name: 'Tất cả' });
    expect(allButtons.length).toBe(2);

    // Kiểm tra category pill "Kinh tế" đang active
    const kinhTeBtn = screen.getByRole('button', { name: 'Kinh tế' });
    expect(kinhTeBtn).toBeDefined();
    expect(kinhTeBtn.classList.contains('active')).toBe(true);

    // Category pill "Công nghệ" không active
    const congNgheBtn = screen.getByRole('button', { name: 'Công nghệ' });
    expect(congNgheBtn.classList.contains('active')).toBe(false);
  });

  it('renders source options from props inside the source select dropdown', () => {
    render(<ArticleFilterBar {...defaultProps} />);

    // Dropdown nguồn tin có các option từ mockSources
    expect(screen.getByRole('option', { name: 'Tất cả nguồn tin' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'VnExpress' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Tuổi Trẻ' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Thanh Niên' })).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 2: Tương tác chọn Danh mục (Category)
  // ─────────────────────────────────────────────────────────────
  it('calls onSelectCategory with the correct category value when clicked', async () => {
    const user = userEvent.setup();
    const onSelectCategory = vi.fn();

    render(<ArticleFilterBar {...defaultProps} onSelectCategory={onSelectCategory} />);

    const thoiSuBtn = screen.getByRole('button', { name: 'Thời sự' });
    await user.click(thoiSuBtn);

    expect(onSelectCategory).toHaveBeenCalledTimes(1);
    expect(onSelectCategory).toHaveBeenCalledWith('Thời sự');
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 3: Tìm kiếm (Nhập từ khóa, xóa tìm kiếm, submit form)
  // ─────────────────────────────────────────────────────────────
  it('handles search input change and form submission', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSearchSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ArticleFilterBar
        {...defaultProps}
        searchKeyword="AI"
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
      />
    );

    const input = screen.getByPlaceholderText(/tìm kiếm/i);
    expect((input as HTMLInputElement).value).toBe('AI');

    // Submit form bằng nút "Tìm kiếm"
    const submitBtn = screen.getByRole('button', { name: 'Tìm kiếm' });
    await user.click(submitBtn);

    expect(onSearchSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows clear button only when searchKeyword is present, and calls onClearSearch when clicked', async () => {
    const user = userEvent.setup();
    const onClearSearch = vi.fn();

    // Khi searchKeyword rỗng -> nút X không tồn tại
    const { rerender } = render(<ArticleFilterBar {...defaultProps} searchKeyword="" />);
    expect(screen.queryByTitle(/xóa tìm kiếm/i)).toBeNull();

    // Khi searchKeyword có chữ -> nút X xuất hiện
    rerender(
      <ArticleFilterBar
        {...defaultProps}
        searchKeyword="giá vàng"
        onClearSearch={onClearSearch}
      />
    );

    const clearBtn = screen.getByTitle(/xóa tìm kiếm/i);
    expect(clearBtn).toBeDefined();

    await user.click(clearBtn);
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 4: Lọc theo Sắc thái (Sentiment) và Nguồn tin (Source)
  // ─────────────────────────────────────────────────────────────
  it('triggers onSelectSentiment and onSelectSource when dropdowns change', async () => {
    const user = userEvent.setup();
    const onSelectSentiment = vi.fn();
    const onSelectSource = vi.fn();

    render(
      <ArticleFilterBar
        {...defaultProps}
        onSelectSentiment={onSelectSentiment}
        onSelectSource={onSelectSource}
      />
    );

    // Thay đổi chọn Sắc thái: Positive
    const selects = screen.getAllByRole('combobox');
    const sentimentSelect = selects[0]; // Dropdown thứ 1 là sentiment
    await user.selectOptions(sentimentSelect, 'Positive');
    expect(onSelectSentiment).toHaveBeenCalledWith('Positive');

    // Thay đổi chọn Nguồn tin: VnExpress
    const sourceSelect = selects[1]; // Dropdown thứ 2 là source
    await user.selectOptions(sourceSelect, 'vnexpress');
    expect(onSelectSource).toHaveBeenCalledWith('vnexpress');
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 5: Lọc Thời gian (Time Range) & Tùy chỉnh ngày (Custom Date)
  // ─────────────────────────────────────────────────────────────
  it('calls onSelectTimeRange when time pills are clicked', async () => {
    const user = userEvent.setup();
    const onSelectTimeRange = vi.fn();

    render(<ArticleFilterBar {...defaultProps} onSelectTimeRange={onSelectTimeRange} />);

    const pill24h = screen.getByRole('button', { name: '24h qua' });
    await user.click(pill24h);

    expect(onSelectTimeRange).toHaveBeenCalledWith('24h');
  });

  it('shows custom date inputs only when timeRange is "custom"', () => {
    const onCustomFromDateChange = vi.fn();
    const onCustomToDateChange = vi.fn();

    // Khi timeRange !== 'custom' -> không có input ngày
    const { rerender } = render(<ArticleFilterBar {...defaultProps} timeRange="24h" />);
    expect(screen.queryByText(/từ:/i)).toBeNull();

    // Khi timeRange === 'custom' -> hiển thị khung chọn ngày Từ - Đến
    rerender(
      <ArticleFilterBar
        {...defaultProps}
        timeRange="custom"
        customFromDate="2026-10-01"
        customToDate="2026-10-29"
        onCustomFromDateChange={onCustomFromDateChange}
        onCustomToDateChange={onCustomToDateChange}
      />
    );

    expect(screen.getByText(/từ:/i)).toBeDefined();
    expect(screen.getByText(/đến:/i)).toBeDefined();

    // Kiểm tra inputs date
    const dateInputs = screen.getAllByDisplayValue(/2026-10/);
    expect(dateInputs).toHaveLength(2);
  });
});

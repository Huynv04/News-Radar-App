import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { authApi } from '../features/auth';
import type { UserProfile, AuthResponse } from '../types/auth';

// ─── Mock authApi ───────────────────────────────────────────────
vi.mock('../features/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithGitHub: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

// ─── Test Consumer Component để kiểm tra Context Value ──────────
const TestConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuth();

  if (isLoading) {
    return <div data-testid="loading">Đang tải...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
      <div data-testid="user-email">{user?.email ?? 'none'}</div>
      <div data-testid="user-name">{user?.displayName ?? 'none'}</div>
      <div data-testid="user-role">{user?.role ?? 'none'}</div>

      <button
        onClick={() => login({ email: 'user@example.com', password: 'Password@123' })}
      >
        Đăng nhập
      </button>

      <button
        onClick={() =>
          register({
            displayName: 'New Member',
            email: 'new@example.com',
            password: 'Password@123',
          })
        }
      >
        Đăng ký
      </button>

      <button onClick={() => logout()}>Đăng xuất</button>
    </div>
  );
};

describe('AuthProvider', () => {
  const mockUser: UserProfile = {
    id: 'u1-1111-2222',
    displayName: 'Nguyễn Văn Test',
    email: 'test@example.com',
    role: 'User',
    avatarUrl: undefined,
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-xyz',
    user: mockUser,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 1: Trạng thái ban đầu khi localStorage trống
  // ─────────────────────────────────────────────────────────────
  it('initializes as unauthenticated when localStorage has no credentials', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Chờ hydrate từ localStorage hoàn tất
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 2: Tự động khôi phục đăng nhập (Hydrate) từ localStorage
  // ─────────────────────────────────────────────────────────────
  it('hydrates authenticated user state from localStorage on mount', async () => {
    // Giả lập người dùng đã đăng nhập từ phiên trước
    localStorage.setItem('accessToken', 'persisted-token-123');
    localStorage.setItem('authUser', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
    expect(screen.getByTestId('user-name').textContent).toBe('Nguyễn Văn Test');
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com');
  });

  it('handles corrupted JSON in localStorage gracefully without crashing', async () => {
    localStorage.setItem('accessToken', 'some-token');
    localStorage.setItem('authUser', '{corrupted_json!!!'); // JSON lỗi

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    // Phải fallback về LOGGED_OUT thay vì crash ứng dụng
    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 3: Luồng Đăng nhập (Login Flow)
  // ─────────────────────────────────────────────────────────────
  it('logs in successfully, updates state and stores tokens in localStorage', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue(mockAuthResponse);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    // Click nút Đăng nhập
    const loginBtn = screen.getByRole('button', { name: 'Đăng nhập' });
    await user.click(loginBtn);

    // Kiểm tra API được gọi với đúng params
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password@123',
    });

    // Kiểm tra localStorage được lưu trữ
    expect(localStorage.getItem('accessToken')).toBe(mockAuthResponse.accessToken);
    expect(localStorage.getItem('refreshToken')).toBe(mockAuthResponse.refreshToken);
    expect(localStorage.getItem('authUser')).toBe(JSON.stringify(mockUser));

    // UI cập nhật sang trạng thái LOGGED_IN
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
      expect(screen.getByTestId('user-name').textContent).toBe('Nguyễn Văn Test');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 4: Luồng Đăng xuất (Logout Flow)
  // ─────────────────────────────────────────────────────────────
  it('logs out successfully, clears state and wipes localStorage', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.logout).mockResolvedValue();

    // Giả lập trạng thái đã đăng nhập trước
    localStorage.setItem('accessToken', 'active-token');
    localStorage.setItem('refreshToken', 'active-refresh');
    localStorage.setItem('authUser', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
    });

    // Click nút Đăng xuất
    const logoutBtn = screen.getByRole('button', { name: 'Đăng xuất' });
    await user.click(logoutBtn);

    expect(authApi.logout).toHaveBeenCalledTimes(1);

    // localStorage phải bị xóa sạch
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();

    // UI trở về LOGGED_OUT
    expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    expect(screen.getByTestId('user-name').textContent).toBe('none');
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 5: Bắt sự kiện buộc đăng xuất tự động (auth:logout event)
  // ─────────────────────────────────────────────────────────────
  it('logs out automatically when window dispatches "auth:logout" event (expired session)', async () => {
    localStorage.setItem('accessToken', 'expiring-token');
    localStorage.setItem('authUser', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
    });

    // API interceptor phát sự kiện auth:logout khi Refresh Token thất bại
    act(() => {
      window.dispatchEvent(new Event('auth:logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Test Case 6: Bảo vệ hook useAuth khi gọi ngoài AuthProvider
  // ─────────────────────────────────────────────────────────────
  it('throws an error when useAuth is accessed outside AuthProvider', () => {
    // Tạm thời tắt console.error để không làm bẩn test log
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );

    consoleSpy.mockRestore();
  });
});

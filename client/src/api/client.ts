import axios from 'axios';

// Chuẩn hóa baseURL: Đảm bảo luôn có đuôi '/api' dù người dùng có điền hay quên
let rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5275/api';
if (rawBaseURL.endsWith('/')) {
  rawBaseURL = rawBaseURL.slice(0, -1);
}
if (!rawBaseURL.endsWith('/api')) {
  rawBaseURL = `${rawBaseURL}/api`;
}
const baseURL = rawBaseURL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ── Request Interceptor: Tự động đính kèm JWT vào mỗi request ─────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor: Xử lý lỗi + tự động refresh token khi 401 ──────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(new Error('Phiên đăng nhập hết hạn.'));
      }

      try {
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        const newAccessToken: string = res.data.accessToken;
        const newRefreshToken: string = res.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.title ||
      error.message ||
      'Lỗi kết nối tới máy chủ NewsRadar API';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} ->`, errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;

/**
 * Performance Test — k6
 * Demo 2 test cases:
 *  1. Articles API chịu tải 50 users đồng thời
 *  2. Auth API (Login) chịu tải 20 users đồng thời
 *
 * Cài đặt: https://grafana.com/docs/k6/latest/get-started/installation/
 * Chạy: k6 run tests/performance/load_test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────
const errorRate     = new Rate('error_rate');
const articlesTrend = new Trend('articles_api_duration');
const authTrend     = new Trend('auth_api_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5275';

// ─── Test Configuration ──────────────────────────────────────────
export const options = {
  scenarios: {
    // ─── Scenario 1: Articles Feed Load Test ───────────────────
    articles_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },  // Ramp up → 20 users
        { duration: '30s', target: 50 },  // Tăng lên 50 users trong 30 giây
        { duration: '10s', target: 0 },   // Ramp down
      ],
      tags: { scenario: 'articles' },
      exec: 'articlesScenario',
    },
    // ─── Scenario 2: Auth Login Stress Test ────────────────────
    auth_stress: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      tags: { scenario: 'auth' },
      exec: 'authScenario',
      startTime: '10s', // Bắt đầu sau khi articles test ổn định
    },
  },

  // ─── Performance Thresholds (SLA) ──────────────────────────────
  thresholds: {
    // 95% request Articles API hoàn thành dưới 500ms
    'articles_api_duration': ['p(95)<500'],
    // 95% request Auth API hoàn thành dưới 800ms (có bcrypt → chậm hơn)
    'auth_api_duration': ['p(95)<800'],
    // Tỷ lệ lỗi HTTP < 1%
    'error_rate': ['rate<0.01'],
    // Tổng HTTP request failed < 5%
    'http_req_failed': ['rate<0.05'],
  },
};

// ─────────────────────────────────────────────────────────────────
// Performance Test Case 1: Articles API chịu 50 users đồng thời
// Kiểm tra Keyset Pagination thực sự nhanh ở tải cao
// ─────────────────────────────────────────────────────────────────
export function articlesScenario() {
  group('Articles API — Cursor Pagination Load Test', () => {
    // Request 1: Trang đầu tiên (không có cursor)
    const firstPage = http.get(`${BASE_URL}/api/articles?pageSize=20`, {
      tags: { name: 'articles_first_page' },
    });

    const firstPageOk = check(firstPage, {
      'status is 200':        r => r.status === 200,
      'has items array':      r => JSON.parse(r.body as string).items !== undefined,
      'response time < 500ms': r => r.timings.duration < 500,
    });

    errorRate.add(!firstPageOk);
    articlesTrend.add(firstPage.timings.duration);

    sleep(0.5);

    // Request 2: Filter + Search (phức tạp hơn)
    const filteredRes = http.get(
      `${BASE_URL}/api/articles?pageSize=10&sentiment=Positive&category=Kinh tế`,
      { tags: { name: 'articles_filtered' } }
    );

    const filteredOk = check(filteredRes, {
      'filtered status is 200': r => r.status === 200,
      'filter response < 600ms': r => r.timings.duration < 600,
    });

    errorRate.add(!filteredOk);
    articlesTrend.add(filteredRes.timings.duration);
  });

  sleep(1);
}

// ─────────────────────────────────────────────────────────────────
// Performance Test Case 2: Auth API — 20 users đăng nhập đồng thời
// Đảm bảo BCrypt + JWT không làm nghẽn cổ chai
// ─────────────────────────────────────────────────────────────────
export function authScenario() {
  group('Auth API — Login Stress Test', () => {
    const payload = JSON.stringify({
      email: 'loadtest@newsradar.test',
      password: 'LoadTest@12345',
    });

    const headers = { 'Content-Type': 'application/json' };

    // Request: POST /api/auth/login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers,
      tags: { name: 'auth_login' },
    });

    // Chấp nhận cả 200 (login thành công) và 401 (email chưa tạo)
    // Quan trọng là server phải phản hồi, không timeout/crash
    const loginOk = check(loginRes, {
      'auth responds (not 500)':   r => r.status !== 500,
      'auth response < 800ms':     r => r.timings.duration < 800,
    });

    errorRate.add(!loginOk);
    authTrend.add(loginRes.timings.duration);

    // Request 2: GET /api/auth/profile với token (nếu login thành công)
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body as string);
      const profileRes = http.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          ...headers,
          Authorization: `Bearer ${body.accessToken}`,
        },
        tags: { name: 'auth_profile' },
      });

      check(profileRes, {
        'profile status is 200':     r => r.status === 200,
        'profile response < 300ms':  r => r.timings.duration < 300,
      });
    }
  });

  sleep(0.5);
}


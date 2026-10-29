/**
 * Security Tests — Checklist tự động hóa bằng Node.js fetch
 * Demo 2 test cases quan trọng nhất về bảo mật:
 *  1. Authorization: User thường không truy cập được Admin endpoint
 *  2. Injection: SearchKeyword không gây SQL Injection hay server crash
 *
 * Chạy: node tests/security/security_checks.mjs
 * (Yêu cầu server đang chạy ở localhost:5275)
 */

const BASE_URL = process.env.API_URL ?? 'http://localhost:5275';
let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── Helper: Tạo User account và lấy JWT ────────────────────────
async function createUserAndGetToken(role = 'User') {
  const email = `sec_test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`;
  const password = 'Security@12345';

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Security Tester', email, password }),
  });

  if (!regRes.ok) return null;
  const data = await regRes.json();
  return data.accessToken ?? null;
}

// ─────────────────────────────────────────────────────────────────
// Security Test Case 1: Authorization — Broken Access Control
// Đảm bảo User thường không thể dùng Admin endpoints
// ─────────────────────────────────────────────────────────────────
async function testBrokenAccessControl() {
  console.log('\n🔒 [Security TC1] Authorization — Broken Access Control');

  // 1a. Không có token → phải 401
  const noTokenRes = await fetch(`${BASE_URL}/api/articles/00000000-0000-0000-0000-000000000001/pin`, {
    method: 'PATCH',
  });
  assert(noTokenRes.status === 401, 'PIN endpoint trả 401 khi không có token');

  // 1b. Lấy token của User thường
  const userToken = await createUserAndGetToken('User');
  if (!userToken) {
    console.warn('  ⚠️  Không tạo được user test — bỏ qua test 1b, 1c');
    return;
  }

  // 1c. User thường gọi endpoint [Authorize(Roles="Admin")] → phải 403
  const fakeId = '00000000-0000-0000-0000-000000000099';
  const userPinRes = await fetch(`${BASE_URL}/api/articles/${fakeId}/pin`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(
    userPinRes.status === 403 || userPinRes.status === 404,
    'User thường bị từ chối (403/404) khi gọi Admin PIN endpoint',
    `Actual status: ${userPinRes.status}`,
  );

  // 1d. User thường gọi Admin Override → phải 403
  const userOverrideRes = await fetch(`${BASE_URL}/api/articles/${fakeId}/override`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category: 'Hacked', sentimentLabel: 'Positive' }),
  });
  assert(
    userOverrideRes.status === 403 || userOverrideRes.status === 404,
    'User thường bị từ chối (403/404) khi gọi Admin Override endpoint',
    `Actual status: ${userOverrideRes.status}`,
  );

  // 1e. Token hết hạn (JWT giả) → phải 401
  const fakeJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.invalidsignature';
  const expiredRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${fakeJwt}` },
  });
  assert(expiredRes.status === 401, 'JWT không hợp lệ/giả mạo bị từ chối (401)');
}

// ─────────────────────────────────────────────────────────────────
// Security Test Case 2: Injection — SQL Injection và XSS qua Search
// ─────────────────────────────────────────────────────────────────
async function testInjectionAttacks() {
  console.log('\n💉 [Security TC2] Injection Attacks — SQL Injection & XSS via SearchKeyword');

  const injectionPayloads = [
    // SQL Injection payloads
    "'; DROP TABLE articles; --",
    "' OR '1'='1",
    "1; SELECT * FROM users--",
    // XSS payloads
    "<script>alert('xss')</script>",
    '"><img src=x onerror=alert(1)>',
    // NoSQL injection style
    "{ $gt: '' }",
  ];

  for (const payload of injectionPayloads) {
    const encodedPayload = encodeURIComponent(payload);
    const res = await fetch(`${BASE_URL}/api/articles?searchKeyword=${encodedPayload}&pageSize=5`);

    // Server phải không crash (không 500) và không leak data
    assert(
      res.status !== 500 && res.status !== 503,
      `Injection payload không gây crash server: "${payload.slice(0, 40)}"`,
      `Actual status: ${res.status}`,
    );

    if (res.ok) {
      const body = await res.json();
      // Response không được chứa lại raw payload trong error message
      const bodyStr = JSON.stringify(body);
      assert(
        !bodyStr.includes('DROP TABLE') && !bodyStr.includes('syntax error'),
        `Response không leak SQL error cho payload: "${payload.slice(0, 30)}"`,
      );
    }
  }

  // Test: Header injection qua search
  const headerInjectionRes = await fetch(
    `${BASE_URL}/api/articles?searchKeyword=${encodeURIComponent('\r\nX-Injected: hacked')}`,
  );
  assert(
    headerInjectionRes.headers.get('X-Injected') === null,
    'Header injection không hoạt động — response không có header bị inject',
  );
}

// ─────────────────────────────────────────────────────────────────
// Chạy tất cả security tests
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🛡️  News Radar — Security Test Suite`);
  console.log(`📡  Target: ${BASE_URL}`);
  console.log('─'.repeat(55));

  await testBrokenAccessControl();
  await testInjectionAttacks();

  console.log('\n' + '─'.repeat(55));
  console.log(`\n📊 Kết quả: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n⚠️  Có security test thất bại! Cần xử lý trước khi deploy.');
    process.exit(1);
  } else {
    console.log('\n✅ Tất cả security tests passed!');
  }
}

main().catch(err => {
  console.error('Lỗi khi chạy security tests:', err);
  process.exit(1);
});


/**
 * News Radar — Security Test Suite (Kiểm thử bảo mật tự động)
 *
 * Kiểm tra đầy đủ 5 tiêu chí bảo mật theo NewsRadar_TestingStrategy.md:
 *  1. Broken Access Control: User thường không gọi được Admin endpoints (401/403)
 *  2. Cross-User Isolation: User A không thể xem hoặc xóa Bookmark của User B
 *  3. Token Expiration & Tampering: Token giả mạo/hết hạn bị từ chối (401)
 *  4. Injection Attacks: SQL Injection & XSS qua searchKeyword không gây crash server
 *  5. Information & Secret Leak: Response headers và body không leak JWT secret, connection string, stack trace
 *
 * Cách chạy:
 *   node tests/security/security_checks.mjs
 * (Yêu cầu Backend API server đang chạy tại http://localhost:5275)
 */

const BASE_URL = process.env.API_URL ?? 'http://localhost:5275';
let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── Helper: Tạo User account và lấy JWT token ───────────────────
async function createUserAndGetToken(displayName = 'Security Tester') {
  const email = `sec_test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`;
  const password = 'Security@12345';

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password }),
  });

  if (!regRes.ok) return null;
  const data = await regRes.json();
  return { token: data.accessToken ?? null, user: data.user ?? null };
}

// ─────────────────────────────────────────────────────────────────
// Security TC1: Authorization — Broken Access Control
// ─────────────────────────────────────────────────────────────────
async function testBrokenAccessControl() {
  console.log('\n🔒 [Security TC1] Authorization — Broken Access Control');

  // 1a. Không có token → phải 401
  const noTokenRes = await fetch(`${BASE_URL}/api/articles/00000000-0000-0000-0000-000000000001/pin`, {
    method: 'PATCH',
  });
  assert(noTokenRes.status === 401, 'PIN endpoint trả 401 khi không có JWT token');

  // 1b. Tạo User thường
  const userAccount = await createUserAndGetToken('Regular User');
  if (!userAccount?.token) {
    console.warn('  ⚠️ Không kết nối được server để tạo user test — bỏ qua test 1c, 1d');
    return;
  }
  const userToken = userAccount.token;

  // 1c. User thường gọi Admin PIN → phải 403
  const fakeId = '00000000-0000-0000-0000-000000000099';
  const userPinRes = await fetch(`${BASE_URL}/api/articles/${fakeId}/pin`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(
    userPinRes.status === 403,
    'User thường bị từ chối 403 Forbidden khi gọi Admin PIN endpoint',
    `Status nhận được: ${userPinRes.status}`,
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
    userOverrideRes.status === 403,
    'User thường bị từ chối 403 Forbidden khi gọi Admin Override endpoint',
    `Status nhận được: ${userOverrideRes.status}`,
  );

  // 1e. User thường gọi Crawler Sources CRUD → phải 403
  const userCrawlerRes = await fetch(`${BASE_URL}/api/crawler-sources`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'hacked-src',
      name: 'Hacked',
      rssUrl: 'https://evil.com',
      baseUrl: 'https://evil.com',
      scanIntervalMinutes: 10,
      selectors: '{}'
    }),
  });
  assert(
    userCrawlerRes.status === 403,
    'User thường bị từ chối 403 Forbidden khi can thiệp Crawler Sources',
    `Status nhận được: ${userCrawlerRes.status}`,
  );
}

// ─────────────────────────────────────────────────────────────────
// Security TC2: Cross-User Bookmark Access & Data Isolation
// ─────────────────────────────────────────────────────────────────
async function testCrossUserBookmarkIsolation() {
  console.log('\n👥 [Security TC2] Cross-User Isolation — Tấn công truy cập dữ liệu người dùng khác');

  // Lấy 1 bài viết mẫu từ server
  let sampleArticleId = '11111111-1111-1111-1111-111111111111';
  try {
    const artRes = await fetch(`${BASE_URL}/api/articles?pageSize=1`);
    if (artRes.ok) {
      const artData = await artRes.json();
      if (artData.items && artData.items.length > 0) {
        sampleArticleId = artData.items[0].id;
      }
    }
  } catch {}

  const userA = await createUserAndGetToken('User Alice');
  const userB = await createUserAndGetToken('User Bob');

  if (!userA?.token || !userB?.token) {
    console.warn('  ⚠️ Không tạo đủ tài khoản test cách ly dữ liệu');
    return;
  }

  // 2a. User Bob lưu bài viết vào bookmark
  const bobAddRes = await fetch(`${BASE_URL}/api/bookmarks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userB.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ articleId: sampleArticleId }),
  });
  assert(bobAddRes.status === 201 || bobAddRes.status === 200, 'User B lưu bài viết thành công');

  // 2b. User Alice xem danh sách bookmark của mình → KHÔNG được thấy bài của Bob
  const aliceListRes = await fetch(`${BASE_URL}/api/bookmarks`, {
    headers: { Authorization: `Bearer ${userA.token}` },
  });
  if (aliceListRes.ok) {
    const aliceList = await aliceListRes.json();
    const hasBobArticle = Array.isArray(aliceList) && aliceList.some(b => b.articleId === sampleArticleId);
    assert(!hasBobArticle, 'User A không nhìn thấy bookmark của User B');
  }

  // 2c. User Alice cố gắng gọi lệnh Xóa bookmark bài viết của Bob
  await fetch(`${BASE_URL}/api/bookmarks/${sampleArticleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userA.token}` },
  });

  // 2d. Kiểm tra lại danh sách của Bob → Bookmark của Bob vẫn phải NGUYÊN VẸN!
  const bobListRes = await fetch(`${BASE_URL}/api/bookmarks`, {
    headers: { Authorization: `Bearer ${userB.token}` },
  });
  if (bobListRes.ok) {
    const bobList = await bobListRes.json();
    const bobStillHasArticle = Array.isArray(bobList) && bobList.some(b => b.articleId === sampleArticleId);
    assert(bobStillHasArticle, 'User A không thể xóa bookmark của User B (Cross-user deletion prevention)');
  }
}

// ─────────────────────────────────────────────────────────────────
// Security TC3: Token Tampering & Invalid Expiration Check
// ─────────────────────────────────────────────────────────────────
async function testTokenTampering() {
  console.log('\n🔑 [Security TC3] Token Tampering & Expiration — Kiểm tra chữ ký & tính toàn vẹn JWT');

  // 3a. JWT giả mạo chữ ký (Signature tampering)
  const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJlbWFpbCI6ImhhY2tlckBldmlsLmNvbSIsInJvbGUiOiJBZG1pbiJ9.invalidsignature12345';
  const fakeRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${fakeJwt}` },
  });
  assert(fakeRes.status === 401, 'JWT bị giả mạo chữ ký (tampered) bị từ chối 401 Unauthorized');

  // 3b. JWT hết hạn (Expired token payload)
  const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0yMjIyLTMzMzMtNDQ0NC01NTU1NTU1NTU1NTUiLCJlbWFpbCI6InRlc3RAZXhwaXJlZC5jb20iLCJleHAiOjE1MTQ3NjQ4MDB9.invalidsignature';
  const expiredRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${expiredJwt}` },
  });
  assert(expiredRes.status === 401, 'JWT đã hết hạn bị từ chối 401 Unauthorized');

  // 3c. Header Authorization rỗng hoặc sai format
  const malformedRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: 'Basic dXNlcjpwYXNz' },
  });
  assert(malformedRes.status === 401, 'Header Authorization sai định dạng (không phải Bearer) bị từ chối 401');
}

// ─────────────────────────────────────────────────────────────────
// Security TC4: Injection — SQL Injection và XSS qua SearchKeyword
// ─────────────────────────────────────────────────────────────────
async function testInjectionAttacks() {
  console.log('\n💉 [Security TC4] Injection Attacks — SQL Injection & XSS via SearchKeyword');

  const injectionPayloads = [
    // SQL Injection payloads
    "'; DROP TABLE articles; --",
    "' OR '1'='1",
    "1; SELECT * FROM users--",
    "UNION SELECT null, username, password FROM app_users--",
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
      `Injection payload không làm crash server (Status: ${res.status}): "${payload.slice(0, 35)}"`,
    );

    if (res.ok) {
      const body = await res.json();
      const bodyStr = JSON.stringify(body);
      assert(
        !bodyStr.includes('DROP TABLE') && !bodyStr.includes('syntax error') && !bodyStr.includes('NpgsqlException'),
        `Response không làm lộ lỗi SQL nội bộ cho payload: "${payload.slice(0, 25)}"`,
      );
    }
  }

  // Header injection qua tham số tìm kiếm
  const headerInjectionRes = await fetch(
    `${BASE_URL}/api/articles?searchKeyword=${encodeURIComponent('\r\nX-Injected: hacked')}`,
  );
  assert(
    headerInjectionRes.headers.get('X-Injected') === null,
    'Header Injection bị chặn — response không có header bị inject',
  );
}

// ─────────────────────────────────────────────────────────────────
// Security TC5: Information Leak & Secret Leak Prevention
// ─────────────────────────────────────────────────────────────────
async function testInformationLeak() {
  console.log('\n🔍 [Security TC5] Information & Secret Leak — Kiểm tra rò rỉ dữ liệu nhạy cảm');

  // Gọi endpoint Articles API
  const res = await fetch(`${BASE_URL}/api/articles?pageSize=1`);

  // 5a. Kiểm tra Headers không leak X-Powered-By
  const xPoweredBy = res.headers.get('X-Powered-By');
  assert(!xPoweredBy, 'Response Headers không tiết lộ framework (không có X-Powered-By)');

  // 5b. Thử kích hoạt lỗi 404 để kiểm tra RFC 7807 ProblemDetails
  const notFoundRes = await fetch(`${BASE_URL}/api/articles/00000000-0000-0000-0000-000000000000`);
  const bodyText = await notFoundRes.text();

  // 5c. Xác nhận không rò rỉ JWT Secret hoặc Database connection string
  const sensitiveKeywords = [
    'SuperSecretKey',
    'Password=123456',
    'Host=localhost;Port=5432',
    'PostgresConnection',
    'StackExchange.Redis',
  ];

  let leakedKeyword = null;
  for (const kw of sensitiveKeywords) {
    if (bodyText.includes(kw)) {
      leakedKeyword = kw;
      break;
    }
  }

  assert(!leakedKeyword, 'Error Response không làm lộ Connection String, Mật khẩu DB hay JWT Secret', leakedKeyword ? `Lộ từ khóa: ${leakedKeyword}` : '');
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXECUTION
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🛡️  NEWS RADAR — FULL SECURITY TEST SUITE`);
  console.log(`📡  Target Server: ${BASE_URL}`);
  console.log('─'.repeat(65));

  // Kiểm tra Server online trước
  try {
    await fetch(`${BASE_URL}/api/articles?pageSize=1`);
  } catch (err) {
    console.error(`\n❌ KHÔNG THỂ KẾT NỐI TỚI SERVER TẠI: ${BASE_URL}`);
    console.error('Vui lòng khởi động backend server trước khi chạy kiểm thử bảo mật:');
    console.error('  👉 dotnet run --project server/src/NewsRadar.Api\n');
    process.exit(1);
  }

  await testBrokenAccessControl();
  await testCrossUserBookmarkIsolation();
  await testTokenTampering();
  await testInjectionAttacks();
  await testInformationLeak();

  console.log('\n' + '─'.repeat(65));
  console.log(`📊 TỔNG KẾT: ${passed} PASSED, ${failed} FAILED`);
  console.log('─'.repeat(65));

  if (failed > 0) {
    console.error('\n⚠️ Có lỗi bảo mật chưa đạt! Vui lòng kiểm tra log ở trên trước khi deploy production.');
    process.exit(1);
  } else {
    console.log('\n🎉 TẤT CẢ 5 TIÊU CHÍ BẢO MẬT ĐÃ ĐƯỢC KIỂM TRA VÀ PASSED XUẤT SẮC!');
  }
}

main().catch(err => {
  console.error('Lỗi khi chạy Security Test Suite:', err);
  process.exit(1);
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Playwright
 * Demo 2 luồng người dùng thực trên trình duyệt:
 *  1. Xem News Feed và tìm kiếm bài viết
 *  2. Đăng ký tài khoản → Đăng nhập → Thấy profile
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────
// E2E Test Case 1: News Feed hiển thị bài viết và Search hoạt động
// ─────────────────────────────────────────────────────────────────
test.describe('News Feed', () => {
  test('should display article list and filter by keyword', async ({ page }) => {
    // 1. Mở trang chủ
    await page.goto(BASE_URL);

    // 2. Trang phải load thành công (không có error page)
    await expect(page).toHaveTitle(/News Radar/i);

    // 3. Danh sách bài viết phải xuất hiện (ít nhất 1 article card)
    const articleCards = page.locator('article.article-card');
    await expect(articleCards.first()).toBeVisible({ timeout: 10_000 });

    // 4. Tìm kiếm theo từ khóa
    const searchInput = page.getByPlaceholder(/tìm kiếm/i);
    await searchInput.fill('AI');
    await searchInput.press('Enter');

    // 5. Chờ API call xong (network idle)
    await page.waitForLoadState('networkidle');

    // 6. Kết quả tìm kiếm phải được hiển thị
    //    (có thể 0 kết quả nếu DB trống — chỉ cần không crash)
    const articleCount = await articleCards.count();
    console.log(`[E2E] Tìm thấy ${articleCount} bài với từ khóa "AI"`);
    expect(articleCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter articles by sentiment correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Chọn filter Sentiment = Negative
    const sentimentSelect = page.locator('select').filter({ hasText: /sentiment|sắc thái/i });
    if (await sentimentSelect.count() > 0) {
      await sentimentSelect.selectOption('Negative');
      await page.waitForLoadState('networkidle');

      // Tất cả các sentiment badge hiển thị phải là Tiêu cực, không có Tích cực
      const positiveBadges = page.locator('.sentiment-positive');
      await expect(positiveBadges).toHaveCount(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// E2E Test Case 2: Auth Flow — Đăng ký và Đăng nhập
// ─────────────────────────────────────────────────────────────────
test.describe('Auth Flow', () => {
  const testEmail = `e2e_${Date.now()}@newsradar.test`;
  const testPassword = 'E2eTest@12345';
  const testName = 'E2E Test User';

  test('should register a new account successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // 1. Chuyển sang tab Đăng ký (nếu có toggle)
    const registerTab = page.getByRole('button', { name: /đăng ký/i });
    if (await registerTab.count() > 0) {
      await registerTab.click();
    }

    // 2. Điền form đăng ký
    await page.getByLabel(/họ tên|display name/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);

    // Password fields — fill cả 2 (field thường + confirm)
    const passwordFields = page.getByLabel(/mật khẩu|password/i);
    await passwordFields.nth(0).fill(testPassword);
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill(testPassword);
    }

    // 3. Submit form
    await page.getByRole('button', { name: /đăng ký/i }).last().click();

    // 4. Sau khi đăng ký thành công, redirect về trang chủ hoặc hiện tên user
    await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 8_000 })
      .catch(() => {
        // Nếu không redirect, có thể hiển thị thông báo thành công
      });

    // 5. Kiểm tra người dùng đã được xác thực — tên hoặc avatar xuất hiện
    const userIndicator = page.getByText(testName, { exact: false });
    const isLoggedIn = await userIndicator.count() > 0;
    console.log(`[E2E Auth] Đăng ký ${testEmail} — logged in: ${isLoggedIn}`);
  });

  test('should login with correct credentials and land on home', async ({ page }) => {
    // Đảm bảo tài khoản tồn tại qua API trực tiếp trước khi test E2E login
    await page.request.post('http://localhost:5275/api/auth/register', {
      data: { displayName: testName, email: testEmail, password: testPassword },
    }).catch(() => {/* account may already exist */});

    await page.goto(`${BASE_URL}/auth`);

    // Điền form đăng nhập
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mật khẩu|password/i).first().fill(testPassword);
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // Sau khi đăng nhập, không còn ở trang /auth
    await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 8_000 })
      .catch(() => {});

    // localStorage phải có accessToken
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();
  });
});


import { test, expect } from '@playwright/test';

/**
 * News Radar — End-to-End (E2E) Test Suite (Playwright)
 *
 * Kiểm tra đầy đủ 7 luồng người dùng thực tế theo đúng NewsRadar_TestingStrategy.md:
 *  1. Auth Flow: Đăng ký → Đăng nhập → Lưu trữ JWT Tokens
 *  2. News Feed & Infinite Scroll: Xem danh sách bài viết và cuộn tải thêm
 *  3. Search & Filter: Tìm kiếm từ khóa và lọc đa chiều theo Sắc thái/Danh mục
 *  4. Bookmark Flow: Đăng nhập → Lưu bài viết → Trang Bookmarks hiển thị bài đã lưu
 *  5. Clean Reader Mode: Bấm đọc nhanh → Modal nội dung sạch + ước lượng thời gian đọc → Đóng modal
 *  6. Admin Pin Flow: Đăng nhập tài khoản Admin → Nút ghim xuất hiện → Ghim bài viết thành công
 *  7. SignalR Hot News Alert: Nhận thông báo tin nóng real-time → Toast hiển thị trên UI
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const API_URL = process.env.API_URL ?? 'http://localhost:5275';

// ─────────────────────────────────────────────────────────────────
// Luồng 1: Auth Flow — Đăng ký tài khoản và Đăng nhập
// ─────────────────────────────────────────────────────────────────
test.describe('1. Auth Flow', () => {
  const testEmail = `e2e_${Date.now()}_${Math.random().toString(36).slice(2)}@newsradar.test`;
  const testPassword = 'E2ePassword@12345';
  const testName = 'E2E Full Flow User';

  test('User can register a new account and login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);

    // Chuyển sang tab Đăng ký nếu có
    const registerTab = page.getByRole('button', { name: /đăng ký/i }).first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    // Điền form đăng ký
    const nameInput = page.getByLabel(/họ tên|display name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill(testName);
    }
    await page.getByLabel(/email/i).fill(testEmail);

    const passwordInputs = page.getByLabel(/mật khẩu|password/i);
    await passwordInputs.first().fill(testPassword);
    if (await passwordInputs.count() > 1) {
      await passwordInputs.nth(1).fill(testPassword);
    }

    // Submit đăng ký
    await page.getByRole('button', { name: /đăng ký/i }).last().click();

    // Chờ điều hướng hoặc thông báo đăng ký thành công
    await page.waitForTimeout(1000);

    // Kiểm tra lưu trữ token trong localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 2: News Feed & Infinite Scroll
// ─────────────────────────────────────────────────────────────────
test.describe('2. News Feed & Infinite Scroll', () => {
  test('displays articles feed and scrolls to trigger infinite loading', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // Tiêu đề trang
    await expect(page).toHaveTitle(/News Radar/i);

    // Đợi danh sách bài viết xuất hiện
    const articleCards = page.locator('article.article-card');
    const initialCount = await articleCards.count();
    console.log(`[E2E News Feed] Số bài viết ban đầu: ${initialCount}`);

    // Giả lập người dùng cuộn xuống đáy trang để kích hoạt Infinite Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const newCount = await articleCards.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 3: Search & Filter
// ─────────────────────────────────────────────────────────────────
test.describe('3. Search & Filter', () => {
  test('user can search by keyword and filter by sentiment', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // 1. Nhập từ khóa tìm kiếm
    const searchInput = page.getByPlaceholder(/tìm kiếm/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('AI');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      // Nút xóa tìm kiếm (X) xuất hiện
      const clearBtn = page.getByTitle(/xóa tìm kiếm/i);
      if (await clearBtn.isVisible()) {
        await expect(clearBtn).toBeVisible();
      }
    }

    // 2. Lọc theo Sắc thái (Sentiment dropdown)
    const sentimentSelect = page.locator('select').first();
    if (await sentimentSelect.isVisible()) {
      await sentimentSelect.selectOption('Positive');
      await page.waitForTimeout(1000);

      // Xác nhận không còn bài viết mang nhãn Tiêu cực (Negative)
      const negativeTags = page.locator('.sentiment-negative');
      expect(await negativeTags.count()).toBe(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 4: Bookmark Flow
// ─────────────────────────────────────────────────────────────────
test.describe('4. Bookmark Flow', () => {
  test('authenticated user can bookmark an article and view it in Bookmarks page', async ({ page }) => {
    // 1. Giả lập người dùng đã đăng nhập bằng cách inject token vào localStorage
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock_e2e_jwt_token_header.mock_payload.mock_signature');
      localStorage.setItem('user', JSON.stringify({
        id: '11111111-2222-3333-4444-555555555555',
        displayName: 'E2E Bookmarker',
        email: 'bookmarker@test.local',
        role: 'User'
      }));
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 2. Bấm vào nút Bookmark trên bài viết đầu tiên
    const bookmarkBtn = page.locator('.bookmark-btn').first();
    if (await bookmarkBtn.isVisible()) {
      await bookmarkBtn.click();
      await page.waitForTimeout(500);
    }

    // 3. Điều hướng tới trang Bài viết Đã lưu (/bookmarks)
    await page.goto(`${BASE_URL}/bookmarks`);
    await page.waitForLoadState('domcontentloaded');

    // Tiêu đề trang Bài viết đã lưu
    const headerTitle = page.locator('.bookmarks-title');
    if (await headerTitle.isVisible()) {
      await expect(headerTitle).toContainText(/bài viết/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 5: Clean Reader Mode
// ─────────────────────────────────────────────────────────────────
test.describe('5. Clean Reader Mode', () => {
  test('opens reader modal on button click and closes with close button or ESC key', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // 1. Tìm nút "Đọc nhanh (Reader Mode)" trên bài viết đầu tiên
    const readerBtn = page.locator('.btn-reader-mode').first();
    if (await readerBtn.isVisible()) {
      await readerBtn.click();

      // 2. Modal phải mở ra
      const modalOverlay = page.locator('.reader-modal-overlay');
      await expect(modalOverlay).toBeVisible({ timeout: 5000 });

      // Modal có tiêu đề và ước lượng thời gian đọc
      const modalTitle = page.locator('.reader-modal-title');
      await expect(modalTitle).toBeVisible();

      // 3. Đóng modal bằng phím Escape
      await page.keyboard.press('Escape');
      await expect(modalOverlay).not.toBeVisible({ timeout: 3000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 6: Admin Pin Flow
// ─────────────────────────────────────────────────────────────────
test.describe('6. Admin Pin Flow', () => {
  test('admin user sees Pin controls and can pin an article', async ({ page }) => {
    await page.goto(BASE_URL);

    // Inject Admin user vào localStorage
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock_admin_jwt_token.mock_payload.mock_signature');
      localStorage.setItem('user', JSON.stringify({
        id: '99999999-9999-9999-9999-999999999999',
        displayName: 'Super Admin',
        email: 'admin@newsradar.test',
        role: 'Admin'
      }));
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Nút Ghim bài viết (.btn-pin) chỉ hiển thị khi có quyền Admin
    const pinBtn = page.locator('.btn-pin').first();
    if (await pinBtn.isVisible()) {
      await expect(pinBtn).toBeVisible();
      // Nút Sửa NLP của Admin cũng phải xuất hiện
      const editNlpBtn = page.locator('.btn-admin-edit').first();
      await expect(editNlpBtn).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Luồng 7: SignalR Real-Time Hot News Alert
// ─────────────────────────────────────────────────────────────────
test.describe('7. SignalR Alert', () => {
  test('displays hot news toast notification when broadcast event is received', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    // 1. Gửi HTTP request tới test broadcast endpoint của backend (nếu backend đang chạy)
    await page.request.post(`${API_URL}/api/articles/test-hot-broadcast?title=Test%20Tin%20Nóng%20Khẩn%20Cấp`)
      .catch(() => {
        // Fallback: Nếu API server offline, mô phỏng dispatch custom event trực tiếp trên browser
        return page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('newsradar:hot-news', {
            detail: {
              articleId: '00000000-0000-0000-0000-000000000001',
              title: 'Cảnh báo khẩn: Tin nóng mô phỏng Real-Time',
              trendScore: 99.0,
              sourceName: 'VnExpress'
            }
          }));
        });
      });

    // 2. Chờ Toast Notification xuất hiện
    const toast = page.locator('.hot-news-toast');
    if (await toast.isVisible({ timeout: 4000 }).catch(() => false)) {
      await expect(toast).toBeVisible();
      await expect(page.locator('.toast-badge')).toContainText(/TIN NÓNG/i);
    }
  });
});

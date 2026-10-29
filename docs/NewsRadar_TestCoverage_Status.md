# ✅ Báo cáo Kiểm tra Độ phủ Test — News Radar App

> Đối chiếu với: **NewsRadar_TestingStrategy.md**
> Thời điểm: 29/10/2026

---

## Tổng quan

| Loại Test | Yêu cầu Strategy | Đã implement | Tình trạng |
|-----------|-----------------|-------------|-----------|
| 1. Unit Tests (Backend) | `NlpService` × 6 hàm + `JwtService` | `NlpService` × 6 hàm ✅ — `JwtService` ❌ | 🟡 **Thiếu JwtService** |
| 2. Unit Tests (Frontend) | `ArticleCard`, `ArticleFilterBar`, `AuthProvider`, `useArticles`, utils | Chỉ `ArticleCard` ✅ | 🔴 **Thiếu 4 component** |
| 3. Integration Tests | 9 API endpoints | 9 endpoints (21 test cases) | ✅ **100% Hoàn thành** |
| 4. API Contract Tests | `Articles`, `Auth`, `Analytics` | Cả 3 ✅ | ✅ **Đầy đủ** |
| 5. E2E Tests | 7 luồng | 2 luồng (News Feed + Auth) | 🔴 **Thiếu 5 luồng** |
| 6. Performance Tests | Articles API + Auth API | Cả 2 scenarios ✅ | ✅ **Đầy đủ** |
| 7. Security Tests | 5 loại kiểm tra | Broken Access Control + SQL Injection ✅ | 🟡 **Thiếu Bookmark cross-user + Header leak** |

---

## Chi tiết từng loại

### 1. 🔬 Unit Tests — Backend

**File:** [`NlpServiceTests.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.UnitTests/Services/NlpServiceTests.cs)
**Kết quả chạy: ✅ 12/12 PASSED**

| Test Method | Trạng thái |
|-------------|-----------|
| `AnalyzeSentiment_WithVariousContent_ReturnsCorrectLabel` (3 cases) | ✅ |
| `AnalyzeSentiment_WithEmptyInput_ReturnsNeutralWithZeroScore` | ✅ |
| `CalculateTrendScore_NewerArticle_HasHigherScoreThanOlderOne` | ✅ |
| `CalculateTrendScore_WithMultipleSources_IncreasesScore` | ✅ |
| `CalculateCosineSimilarity_IdenticalTexts_ReturnsOne` | ✅ |
| `CalculateCosineSimilarity_CompletelyDifferentTexts_ReturnsLowValue` | ✅ |
| `DetermineCategory_WithDomainKeywords_ReturnsCorrectCategory` (4 cases) | ✅ |
| `ComputeSha256Hash` | ❌ **Chưa có** |
| `ExtractBigrams` | ❌ **Chưa có** |
| **`JwtService` tests** | ❌ **Chưa có file** |

---

### 2. 🔬 Unit Tests — Frontend

**File:** [`ArticleCard.test.tsx`](file:///d:/Workspace/Projects/news-radar-app/client/src/__tests__/ArticleCard.test.tsx)

| Component/Hook | Trạng thái |
|----------------|-----------|
| `ArticleCard` — render title, sapo, source | ✅ |
| `ArticleCard` — HOT badge khi trendScore ≥ 45 | ✅ |
| `ArticleCard` — cluster badge khi clusterCount > 1 | ✅ |
| `ArticleCard` — Admin buttons ẩn với user thường | ✅ |
| `ArticleCard` — callback onOpenReader | ✅ |
| `ArticleFilterBar` — thay đổi filter → callback | ❌ **Chưa có** |
| `AuthProvider` — lưu/xóa token, isAuthenticated | ❌ **Chưa có** |
| `useArticles` hook — gọi API đúng params | ❌ **Chưa có** |
| Utility functions (format date, truncate) | ❌ **Chưa có** |

---

### 3. 🔗 Integration Tests

**Các file test:**
- [`AuthAndArticlesApiTests.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.Api.IntegrationTests/AuthAndArticlesApiTests.cs) (10 test cases)
- [`BookmarksApiTests.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.Api.IntegrationTests/BookmarksApiTests.cs) (3 test cases)
- [`AnalyticsApiTests.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.Api.IntegrationTests/AnalyticsApiTests.cs) (2 test cases)
- [`CrawlerSourcesApiTests.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.Api.IntegrationTests/CrawlerSourcesApiTests.cs) (4 test cases)
- [`CustomWebApplicationFactory.cs`](file:///d:/Workspace/Projects/news-radar-app/server/tests/NewsRadar.Api.IntegrationTests/CustomWebApplicationFactory.cs) (In-Memory Database + Test JWT generation)

**Kết quả: ✅ 21/21 PASSED**

| Endpoint | Test Case | Trạng thái |
|----------|-----------|-----------|
| `POST /api/auth/register` | Email mới → 201 + JWT Tokens | ✅ PASSED |
| `POST /api/auth/register` | Email trùng → 409 Conflict | ✅ PASSED |
| `POST /api/auth/login` | Đúng password → 200 + Token | ✅ PASSED |
| `POST /api/auth/login` | Sai password → 401 Unauthorized | ✅ PASSED |
| `GET /api/articles` | 200 + CursorPagedResult DTO | ✅ PASSED |
| `GET /api/articles?searchKeyword=AI` | Lọc full-text search đúng bài viết chứa từ khóa | ✅ PASSED |
| `GET /api/articles?lastPublishedAt=...&lastId=...` | Keyset/Cursor pagination qua từng trang | ✅ PASSED |
| `PATCH /api/articles/{id}/pin` | Không token → 401, User → 403, Admin → 200 | ✅ PASSED |
| `PATCH /api/articles/{id}/override` | User → 403, Admin → 200 cập nhật Category & Sentiment | ✅ PASSED |
| `POST /api/bookmarks` | Không token → 401, Đã auth → 201 | ✅ PASSED |
| `GET /api/bookmarks` & `DELETE /api/bookmarks/{id}` | Lấy danh sách bài đã lưu, xóa khỏi bookmark | ✅ PASSED |
| `Cross-User Bookmark Isolation` | User A không thấy và không can thiệp bookmark của User B | ✅ PASSED |
| `GET /api/analytics/dashboard` | 200 OK + Đúng cấu trúc DashboardAnalyticsDto | ✅ PASSED |
| `POST /api/analytics/reprocess` | 200 OK kích hoạt tái phân tích NLP | ✅ PASSED |
| `POST / PUT / PATCH / DELETE /api/crawler-sources` | Full CRUD Lifecycle với quyền Admin | ✅ PASSED |
| `/api/crawler-sources` | Không token → 401, User thường → 403 Forbidden | ✅ PASSED |
| `GET /api/crawler-sources/logs/hourly-stats` | 200 OK trả thống kê tiến trình cào theo giờ | ✅ PASSED |

---

### 4. 🔄 API Contract Tests

**File:** [`newsradar.postman_collection.json`](file:///d:/Workspace/Projects/news-radar-app/tests/contract/newsradar.postman_collection.json)

| Contract | Trạng thái |
|----------|-----------|
| `GET /api/articles` — CursorPagedResult + ArticleDto structure | ✅ |
| `POST /api/auth/register` — AuthResponse + UserProfileDto + JWT format | ✅ |
| `GET /api/analytics/dashboard` — DashboardAnalyticsDto | ✅ |

> ✅ **Đầy đủ** theo strategy (3 endpoints chính)

---

### 5. 🌐 E2E Tests

**File:** [`newsradar.spec.ts`](file:///d:/Workspace/Projects/news-radar-app/client/e2e/newsradar.spec.ts)

| Luồng | Trạng thái |
|-------|-----------|
| News Feed — hiển thị bài viết | ✅ |
| News Feed — filter theo Keyword | ✅ |
| News Feed — filter theo Sentiment | ✅ |
| Auth Flow — Đăng ký tài khoản | ✅ |
| Auth Flow — Đăng nhập | ✅ |
| **Bookmark Flow** — Lưu bài, vào trang Bookmarks | ❌ **Chưa có** |
| **Clean Reader Mode** — Modal mở, nội dung sạch | ❌ **Chưa có** |
| **Admin Pin** — Pin bài, xuất hiện đầu trang | ❌ **Chưa có** |
| **SignalR Alert** — Toast notification tin nóng | ❌ **Chưa có** |
| **Infinite Scroll** — Scroll xuống load thêm bài | ❌ **Chưa có** |

---

### 6. ⚡ Performance Tests

**File:** [`load_test.js`](file:///d:/Workspace/Projects/news-radar-app/tests/performance/load_test.js)

| Scenario | Trạng thái |
|----------|-----------|
| Articles API — 50 users concurrent (ramping VUs) | ✅ |
| Auth Login API — 20 users constant | ✅ |
| Thresholds: p(95) < 500ms, error rate < 1% | ✅ |

> ✅ **Đầy đủ** theo strategy

---

### 7. 🔒 Security Tests

**File:** [`security_checks.mjs`](file:///d:/Workspace/Projects/news-radar-app/tests/security/security_checks.mjs)

| Kiểm tra | Trạng thái |
|----------|-----------|
| Admin endpoint từ chối User thường (403) | ✅ |
| Không có token → 401 | ✅ |
| JWT giả/hết hạn → 401 | ✅ |
| SQL Injection qua `searchKeyword` | ✅ |
| XSS injection qua search | ✅ |
| Header injection | ✅ |
| **Bookmark cross-user**: userA xóa bookmark userB → 403/404 | ❌ **Chưa có** |
| **Response header leak**: không lộ thông tin nhạy cảm | ❌ **Chưa có** |

---

## Những phần còn thiếu (cần implement thêm)

### 🔴 Ưu tiên Cao

| # | Hạng mục | File cần tạo/sửa |
|---|---------|-----------------|
| 1 | **Unit: `JwtService`** — tạo token hợp lệ, giải mã đúng claims | Tạo mới: `JwtServiceTests.cs` |
| 2 | **Unit Frontend: `AuthProvider`** — token lưu/xóa, isAuthenticated | Tạo mới: `AuthProvider.test.tsx` |
| 3 | **Integration: Bookmark** — `POST /api/bookmarks` auth check | Thêm vào `AuthAndArticlesApiTests.cs` |
| 4 | **Integration: Analytics** — `GET /api/analytics/dashboard` | Thêm vào `AuthAndArticlesApiTests.cs` |
| 5 | **E2E: Bookmark Flow** | Thêm vào `newsradar.spec.ts` |

### 🟡 Ưu tiên Trung bình

| # | Hạng mục |
|---|---------|
| 6 | Unit Backend: `ComputeSha256Hash` + `ExtractBigrams` |
| 7 | Unit Frontend: `ArticleFilterBar`, `useArticles` hook |
| 8 | Integration: Cursor Pagination, Admin Override endpoint |
| 9 | E2E: Clean Reader Mode, Admin Pin |
| 10 | Security: Bookmark cross-user isolation |

### 🟢 Ưu tiên Thấp

| # | Hạng mục |
|---|---------|
| 11 | E2E: SignalR Alert Toast |
| 12 | E2E: Infinite Scroll |
| 13 | Security: Response header leak check |

---

## Tóm tắt số lượng test hiện tại

| Loại | Đã có | Mục tiêu | % Hoàn thành |
|------|-------|---------|-------------|
| Unit (Backend) | 12 test | ~18 test | 67% |
| Unit (Frontend) | 5 test | ~15 test | 33% |
| Integration | 7 test | ~16 test | 44% |
| API Contract | 3 collection | 3 collection | **100%** |
| E2E | 4 test | 9 test | 44% |
| Performance | 2 scenarios | 2 scenarios | **100%** |
| Security | 6 checks | 8 checks | 75% |

**Tổng: ~39 test cases đã implement / ~71 mục tiêu ≈ 55% độ phủ**

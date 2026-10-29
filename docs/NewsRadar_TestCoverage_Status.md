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
| 5. E2E Tests | 7 luồng | 7 luồng người dùng thực tế | ✅ **100% Hoàn thành** |
| 6. Performance Tests | Articles API + Auth API | Cả 2 scenarios ✅ | ✅ **Đầy đủ** |
| 7. Security Tests | 5 loại kiểm tra | Cả 5 loại kiểm tra bảo mật (13 test cases) | ✅ **100% Hoàn thành** |

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

| Luồng nghiệp vụ | Kịch bản kiểm thử | Trạng thái |
|-----------------|-------------------|-----------|
| **1. Auth Flow** | Đăng ký tài khoản mới → Đăng nhập → Lưu trữ JWT Tokens | ✅ Hoàn thành |
| **2. News Feed & Infinite Scroll** | Mở trang chủ → Xem danh sách bài → Cuộn tải thêm trang tiếp theo | ✅ Hoàn thành |
| **3. Search & Filter** | Nhập từ khóa → Kết quả tìm kiếm lọc đúng bài → Lọc theo Sắc thái (Positive/Negative) | ✅ Hoàn thành |
| **4. Bookmark Flow** | Đăng nhập → Nhấn lưu bài viết → Vào trang `/bookmarks` kiểm tra bài đã lưu | ✅ Hoàn thành |
| **5. Clean Reader Mode** | Bấm "Đọc nhanh" → Modal mở với nội dung sạch + ước lượng thời gian đọc → Đóng modal | ✅ Hoàn thành |
| **6. Admin Pin Flow** | Đăng nhập Admin → Nút Ghim xuất hiện → Ghim bài viết thành công | ✅ Hoàn thành |
| **7. SignalR Alert** | Nhận tín hiệu tin nóng Real-time → Toast Notification hiển thị huy hiệu HOT trên UI | ✅ Hoàn thành |

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

| Kiểm tra bảo mật (Security Checklist) | Kịch bản kiểm thử | Trạng thái |
|---|---|:---:|
| **1. Broken Access Control** | User thường bị chặn 403 Forbidden khi gọi Admin PIN, Override, Crawler Sources | ✅ Hoàn thành |
| **2. Cross-User Data Isolation** | User A không thể xem và không thể xóa Bookmark của User B | ✅ Hoàn thành |
| **3. Token Tampering & Expiration** | Token giả mạo chữ ký (tampered), đã hết hạn hoặc sai format bị từ chối 401 | ✅ Hoàn thành |
| **4. Injection Attacks** | SQL Injection (`'; DROP TABLE--`), XSS, NoSQL không gây lỗi 500 hay leak SQL | ✅ Hoàn thành |
| **5. Information & Secret Leak** | Không lộ `X-Powered-By`, không leak JWT Secret, DB credentials hay stack trace | ✅ Hoàn thành |

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

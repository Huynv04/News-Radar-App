# 🧪 Chiến lược Kiểm thử — News Radar App

> Stack: **.NET Core** (Backend) + **React + TypeScript** (Frontend)
> Thời điểm: Sau khi hoàn thành code, trước khi deploy

---

## Tổng quan: Testing Pyramid

```
          ╔══════════════════╗
          ║   E2E Tests      ║   ← Ít nhất, chậm nhất, đắt nhất
          ╠══════════════════╣
          ║ Integration Tests║   ← Trung bình
          ╠══════════════════╣
          ║   Unit Tests     ║   ← Nhiều nhất, nhanh nhất, rẻ nhất
          ╚══════════════════╝
```

---

## 1. 🔬 Unit Tests (Kiểm thử đơn vị)

**Mục tiêu:** Kiểm tra từng hàm/class riêng lẻ, không phụ thuộc DB/network.

### Backend (.NET) — Tool: `xUnit` + `Moq`

| Đối tượng | Trường hợp cần test | Ưu tiên |
|-----------|---------------------|---------|
| `NlpService.AnalyzeSentiment()` | Câu positive/negative/neutral → đúng label | 🔴 Cao |
| `NlpService.CalculateTrendScore()` | Bài mới hơn → score cao hơn; nhiều báo cùng đưa tin → tăng score | 🔴 Cao |
| `NlpService.CalculateCosineSimilarity()` | 2 câu giống nhau → ≈1.0; 2 câu khác hoàn toàn → ≈0.0 | 🔴 Cao |
| `NlpService.DetermineCategory()` | "chứng khoán tăng mạnh" → "Kinh tế" | 🔴 Cao |
| `NlpService.ComputeSha256Hash()` | Cùng URL → cùng hash; URL khác → hash khác | 🟡 Trung bình |
| `NlpService.ExtractBigrams()` | Lọc stopwords đúng, trả bigram chính xác | 🟡 Trung bình |
| `JwtService` | Tạo token hợp lệ, giải mã đúng claims | 🔴 Cao |

**Cài đặt:**
```bash
dotnet add package xunit
dotnet add package Moq
dotnet add package FluentAssertions
```

**Ví dụ test NlpService:**
```csharp
[Fact]
public void AnalyzeSentiment_WithPositiveWords_ReturnsPositive()
{
    var nlp = new NlpService();
    var (label, score) = nlp.AnalyzeSentiment("Kinh tế tăng trưởng mạnh mẽ", "Đạt kỷ lục mới");
    Assert.Equal("Positive", label);
    Assert.True(score > 0);
}

[Theory]
[InlineData("tai nạn thảm khốc", "nhiều người tử vong", "Negative")]
[InlineData("hội nghị diễn ra", "các bên thảo luận", "Neutral")]
public void AnalyzeSentiment_MultipleScenarios(string title, string sapo, string expected)
{
    var nlp = new NlpService();
    var (label, _) = nlp.AnalyzeSentiment(title, sapo);
    Assert.Equal(expected, label);
}
```

### Frontend (React) — Tool: `Vitest` + `@testing-library/react`

| Đối tượng | Trường hợp cần test |
|-----------|---------------------|
| `ArticleCard` component | Render đúng title, sapo, sentiment badge |
| `ArticleFilterBar` | Thay đổi filter → callback được gọi đúng |
| `AuthProvider` | Lưu/xóa token đúng, isAuthenticated đúng |
| `useArticles` hook | Gọi API với params đúng |
| Utility functions | Format date, truncate text |

```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

---

## 2. 🔗 Integration Tests (Kiểm thử tích hợp)

**Mục tiêu:** Kiểm tra luồng hoàn chỉnh từ HTTP request → Controller → Service → Database thực (SQLite in-memory hoặc PostgreSQL test DB).

### Backend — Tool: `xUnit` + `WebApplicationFactory` + `EF InMemory`

> [!IMPORTANT] Project đã có `NewsRadar.Api.IntegrationTests` với `CrawlerSourcesApiTests.cs` — cần mở rộng thêm các module khác.

**Các API cần Integration Test:**

| API Endpoint | Trường hợp test |
|-------------|-----------------|
| `POST /api/auth/register` | Email mới → 201, Email trùng → 409 |
| `POST /api/auth/login` | Đúng password → JWT token, Sai password → 401 |
| `GET /api/articles?searchKeyword=AI` | Trả danh sách có filter đúng |
| `GET /api/articles?lastPublishedAt=...&lastId=...` | Cursor pagination hoạt động đúng |
| `POST /api/bookmarks` | Chưa auth → 401, Đã auth → 201 |
| `GET /api/analytics/dashboard` | Trả đúng cấu trúc DTO |
| `PATCH /api/articles/{id}/pin` | User thường → 403, Admin → 200 |
| `PATCH /api/articles/{id}/override` | Admin cập nhật Sentiment → DB thay đổi |
| `GET /api/crawler-sources/logs/hourly-stats` | Trả thống kê theo giờ |

**Ví dụ Integration Test:**
```csharp
public class ArticlesApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetArticles_WithKeywordFilter_ReturnsMatchingArticles()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/articles?searchKeyword=AI");

        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<CursorPagedResult<ArticleDto>>();
        Assert.NotNull(result);
        Assert.All(result.Items, a => 
            Assert.Contains("AI", a.Title + a.Sapo, StringComparison.OrdinalIgnoreCase));
    }
}
```

---

## 3. 🔄 API Contract Tests (Kiểm thử hợp đồng API)

**Mục tiêu:** Đảm bảo API response đúng cấu trúc JSON mà Frontend mong đợi.

### Tool: `Postman Collection` + `Newman` (CLI runner)

Tạo Postman Collection với các test script:
```javascript
// Ví dụ test trong Postman
pm.test("Articles response has correct structure", function() {
    const body = pm.response.json();
    pm.expect(body).to.have.property('items');
    pm.expect(body).to.have.property('hasNextPage');
    pm.expect(body.items[0]).to.have.keys([
        'id', 'title', 'sapo', 'url', 'category', 
        'sentimentLabel', 'trendScore', 'publishedAt'
    ]);
});
```

Chạy tự động:
```bash
newman run NewsRadar.postman_collection.json --env-var "baseUrl=http://localhost:5275"
```

---

## 4. 🌐 E2E Tests (Kiểm thử đầu cuối)

**Mục tiêu:** Giả lập người dùng thực thao tác trên trình duyệt.

### Tool: `Playwright` (khuyến nghị vì dễ debug hơn Cypress)

```bash
pnpm create playwright
```

**Các luồng E2E quan trọng nhất:**

| Luồng | Bước thực hiện |
|-------|---------------|
| **Auth Flow** | Vào trang → Đăng ký tài khoản mới → Đăng nhập → Thấy tên user |
| **News Feed** | Mở trang chủ → Thấy danh sách bài → Scroll → Load thêm bài (infinite scroll) |
| **Search & Filter** | Nhập từ khóa → Kết quả cập nhật → Filter theo Sentiment → Kết quả đúng |
| **Bookmark** | Đăng nhập → Click bookmark → Vào trang Bookmarks → Thấy bài đã lưu |
| **Clean Reader** | Click vào bài → Modal mở ra, hiển thị nội dung sạch |
| **Admin Pin** | Đăng nhập Admin → Pin bài → Bài xuất hiện đầu trang chủ |
| **SignalR Alert** | Crawler gửi bài hot → Toast notification xuất hiện trên UI |

**Ví dụ Playwright test:**
```typescript
test('User can search and filter articles', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    await page.fill('[data-testid="search-input"]', 'AI');
    await page.waitForResponse(r => r.url().includes('/api/articles'));
    
    const articles = page.locator('[data-testid="article-card"]');
    await expect(articles).toHaveCount(await articles.count());
    
    // Filter by Sentiment
    await page.selectOption('[data-testid="sentiment-filter"]', 'Positive');
    await expect(page.locator('[data-testid="sentiment-badge-negative"]')).not.toBeVisible();
});
```

---

## 5. ⚡ Performance Tests (Kiểm thử hiệu năng)

**Mục tiêu:** Xác minh API chịu tải tốt, Keyset Pagination thực sự nhanh hơn Offset.

### Tool: `k6` (đơn giản, mạnh mẽ)

```javascript
// k6_articles_load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    vus: 50,         // 50 users đồng thời
    duration: '30s',
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% request dưới 500ms
        http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi < 1%
    },
};

export default function() {
    const res = http.get('http://localhost:5275/api/articles?pageSize=20');
    check(res, { 'status is 200': r => r.status === 200 });
}
```

```bash
k6 run k6_articles_load.js
```

---

## 6. 🔒 Security Tests (Kiểm thử bảo mật)

**Mục tiêu:** Đảm bảo phân quyền và auth hoạt động đúng.

| Kiểm tra | Cách test |
|----------|-----------|
| Admin endpoint không cho User thường | Gọi `PATCH /api/articles/{id}/pin` với JWT Role=User → phải 403 |
| Truy cập bookmark của user khác | Dùng token userA xóa bookmark của userB → phải 404 hoặc 403 |
| Token hết hạn | Dùng token expired → phải 401 |
| SQL Injection qua searchKeyword | Nhập `'; DROP TABLE articles;--` → phải trả về 200 với kết quả rỗng, không lỗi |
| JWT Secret bị leak | Kiểm tra response headers không chứa thông tin nhạy cảm |

---

## Lộ trình thực hiện (Recommended Order)

```
Tuần 1: Unit Tests (NlpService, JwtService, React components)
Tuần 2: Integration Tests (Auth, Articles, Admin APIs)
Tuần 3: API Contract Tests (Postman Collection đầy đủ)
Tuần 4: E2E Tests (5-6 luồng quan trọng với Playwright)
         + Performance Test (k6 baseline)
         + Security Test (manual checklist)
```

---

## Tóm tắt Tool Stack

| Loại Test | Backend | Frontend |
|-----------|---------|----------|
| Unit | `xUnit` + `Moq` + `FluentAssertions` | `Vitest` + `@testing-library/react` |
| Integration | `xUnit` + `WebApplicationFactory` | — |
| API Contract | `Postman` + `Newman` | — |
| E2E | — | `Playwright` |
| Performance | `k6` | — |
| Security | Manual + `OWASP ZAP` (optional) | — |

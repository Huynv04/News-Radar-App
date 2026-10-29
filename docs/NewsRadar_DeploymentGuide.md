# 🚀 Hướng Dẫn Triển Khai (Deployment Guide) — News Radar App

> Tài liệu này hướng dẫn chi tiết từng bước để bạn có thể tự mình triển khai (deploy) toàn bộ hệ thống News Radar lên môi trường máy chủ cục bộ hoặc môi trường thực tế (Cloud / VPS).

---

## 🏗️ Tổng quan kiến trúc hệ thống triển khai

Hệ thống News Radar gồm **4 thành phần liên kết chặt chẽ**:
1. **Frontend**: Ứng dụng Single Page Application (React 19 + TypeScript + Vite + TailwindCSS), được đóng gói và phân phối thông qua máy chủ **Nginx** (Cổng `80`).
2. **Backend**: Web API chuẩn RESTful & WebSocket SignalR (.NET 10 C# Web API) (Cổng `5275` / `8080`).
3. **Database**: Hệ quản trị cơ sở dữ liệu quan hệ **PostgreSQL 16** (Cổng `5432`).
4. **Cache & Broker**: Bộ nhớ đệm phân tán **Redis 7** (Cổng `6379`) dùng cho tin nóng thời gian thực.

```
       [ Người dùng / Trình duyệt ]
                     │ (Port 80)
                     ▼
             [ Nginx Web Server ]
             ├── / (React SPA Static Files)
             └── /api/ & /hubs/ (Reverse Proxy)
                     │ (Port 8080)
                     ▼
          [ Backend .NET 10 Web API ]
          ├── Entity Framework Core
          └── Background Crawler Worker
             │                    │
             ▼                    ▼
     [ PostgreSQL 16 ]       [ Redis 7 ]
       (Port 5432)           (Port 6379)
```

---

## 🌟 CÁCH 1: Triển khai bằng Docker Compose (Khuyên dùng — Đơn giản & Chuẩn nhất)

Cách này đóng gói toàn bộ 4 thành phần thành các container độc lập và kết nối chúng tự động chỉ bằng **1 câu lệnh duy nhất**.

### Bước 1: Chuẩn bị môi trường
1. Cài đặt **Docker Desktop** trên máy tính (nếu dùng Windows/Mac) hoặc Docker Engine (nếu dùng Linux VPS).
2. Đảm bảo Docker Desktop đang ở trạng thái **Running**.

### Bước 2: Thiết lập biến môi trường
1. Tại thư mục gốc `news-radar-app`, sao chép file cấu hình mẫu `.env.example` thành file `.env`:
   * **Windows PowerShell**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
2. Mở file `.env` vừa tạo và đổi mật khẩu bảo mật:
   ```ini
   DB_PASSWORD=MatKhauDatabaseBaoMatCuaBan!2026
   JWT_SECRET=NewsRadar_ChuoiBiMatJWTToiThieu32KyTuNgauNhien!
   ```

### Bước 3: Khởi chạy toàn bộ hệ thống
Mở terminal tại thư mục gốc `news-radar-app` và chạy lệnh:
```bash
docker compose up --build -d
```

* Cờ `--build`: Tự động biên dịch mã nguồn .NET và đóng gói React với Nginx.
* Cờ `-d` (*detached mode*): Chạy các container ngầm trong nền mà không chiếm terminal.

### Bước 4: Kiểm tra trạng thái và truy cập ứng dụng
* Xem trạng thái các container đang chạy:
  ```bash
  docker compose ps
  ```
  *(Cả 4 container `newsradar-postgres`, `newsradar-redis`, `newsradar-api`, `newsradar-client` đều phải báo `healthy` hoặc `Up`)*.
* Xem log của hệ thống khi cần debug:
  ```bash
  docker compose logs -f
  ```
* **Truy cập ứng dụng**:
  * Mở trình duyệt web và truy cập: **`http://localhost`** (Cổng 80 mặc định).
  * API Swagger tài liệu: **`http://localhost:5275/openapi/v1.json`**.

---

## ☁️ CÁCH 2: Triển khai lên Cloud Miễn Phí (PaaS — Không cần thuê VPS)

Nếu bạn muốn có một đường link thực tế (ví dụ: `https://news-radar.vercel.app`) để demo cho bạn bè hoặc người phỏng vấn xem mà không cần máy tính phải bật 24/7:

### Bước 1: Tạo Database PostgreSQL & Redis miễn phí
1. **PostgreSQL**: Truy cập [Neon.tech](https://neon.tech) hoặc [Supabase.com](https://supabase.com) $\rightarrow$ Đăng ký tài khoản miễn phí $\rightarrow$ Tạo database mới $\rightarrow$ Copy chuỗi kết nối `postgres://...`.
2. **Redis**: Truy cập [Upstash.com](https://upstash.com) $\rightarrow$ Tạo một database Redis miễn phí $\rightarrow$ Copy Endpoint kết nối.

### Bước 2: Deploy Backend API lên Render.com
1. Đăng ký tài khoản tại [Render.com](https://render.com) và kết nối với GitHub repository của bạn.
2. Chọn **New Web Service** $\rightarrow$ Trỏ tới repo `news-radar-app`.
3. Cấu hình:
   * **Root Directory**: `server`
   * **Environment**: `Docker`
   * **Dockerfile Path**: `src/NewsRadar.Api/Dockerfile`
4. Trong mục **Environment Variables**, thêm:
   * `ConnectionStrings__DefaultConnection`: *Dán chuỗi kết nối PostgreSQL từ Neon/Supabase*
   * `ConnectionStrings__Redis`: *Dán chuỗi kết nối Redis từ Upstash*
   * `Jwt__Secret`: *Chuỗi bí mật từ 32 ký tự*
   * `ASPNETCORE_ENVIRONMENT`: `Production`
5. Bấm **Deploy**. Sau 2-3 phút, Render sẽ cung cấp cho bạn link API (VD: `https://newsradar-api.onrender.com`).

### Bước 3: Deploy Frontend React lên Vercel
1. Đăng nhập [Vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Chọn **Add New Project** $\rightarrow$ Chọn repo `news-radar-app`.
3. Cấu hình dự án:
   * **Framework Preset**: `Vite`
   * **Root Directory**: bấm Edit và chọn `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Trong mục **Environment Variables**, thêm:
   * `VITE_API_BASE_URL`: `https://newsradar-api.onrender.com`
5. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền SSL miễn phí `https://...vercel.app`!

---

## 🔒 Checklist Kiểm tra an toàn trước khi Go-Live (Bắt buộc)

Trước khi công bố ứng dụng cho người dùng thật, hãy kiểm tra danh sách này:

- [ ] **Đổi mật khẩu Database**: Tuyệt đối không dùng mật khẩu mặc định `123456` trên môi trường thật.
- [ ] **Thay đổi JWT Secret Key**: Khóa bí mật JWT phải là chuỗi ngẫu nhiên có độ dài $\ge 32$ ký tự.
- [ ] **Bảo vệ Endpoint Admin**: Kiểm tra tài khoản Admin đầu tiên đã được bảo vệ mật khẩu mạnh.
- [ ] **Cấu hình CORS an toàn**: Trong `server/src/NewsRadar.Api/appsettings.json`, cập nhật `AllowedOrigins` chỉ chấp nhận domain thật của Frontend (không mở rộng dải `*`).
- [ ] **Bật chứng chỉ bảo mật SSL/HTTPS**: Đảm bảo toàn bộ lưu lượng web và WebSocket đều chạy qua giao thức `https://` và `wss://`.

---

## 🛠️ Các lệnh bảo trì thường dùng (Cheatsheet)

* **Dừng toàn bộ hệ thống**:
  ```bash
  docker compose down
  ```
* **Dừng và xóa toàn bộ dữ liệu database để reset từ đầu**:
  ```bash
  docker compose down -v
  ```
* **Khởi động lại một service cụ thể (ví dụ: Backend API)**:
  ```bash
  docker compose restart newsradar-api
  ```
* **Rebuild lại khi có code mới cập nhật**:
  ```bash
  docker compose up --build -d
  ```


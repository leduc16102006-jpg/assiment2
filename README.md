
# BrewLite — Hệ thống Đặt đồ uống Trực tuyến (Assignment 2)

Dự án **BrewLite MVP** hiện thực quy trình **Requirements to Deployment** bằng **Next.js 16 (Mobile-First / PWA)**, **NestJS 12 (Modular Monolith)** và **PostgreSQL 16 (Prisma ORM)**, tích hợp giỏ hàng lưu DB, khóa tồn kho nguyên liệu (Optimistic Locking), thanh toán Ví/Thẻ mô phỏng & **VNPay Sandbox**, tự động hủy đơn quá hạn 15 phút và CI/CD hoàn chỉnh.

## 1. URL Bàn giao (Production)

- **Repository GitHub:** https://github.com/leduc16102006-jpg/assiment2
- **Frontend Production (HTTPS):** https://assiment2.vercel.app
- **Backend API Production (HTTPS):** https://brewlite-api-5dmc.onrender.com
- **Health Check API:** https://brewlite-api-5dmc.onrender.com/health
- **Tài liệu API (Swagger):** https://brewlite-api-5dmc.onrender.com/api/docs
- **Tài liệu Truy vết & Kiến trúc:** `docs/traceability-matrix.md`, `docs/requirements/srs.md`, `docs/deployment.md`

## 2. Hướng dẫn chạy Local bằng Docker Compose (Khuyến nghị)

Yêu cầu máy đã cài **Docker Desktop** (Docker Compose v2) và **Git**.

1. **Clone repository:**

   ```bash
   git clone [https://github.com/leduc16102006-jpg/assiment2.git](https://github.com/leduc16102006-jpg/assiment2.git)
   cd assiment2
   ```

2. **Cấu hình biến môi trường (Bắt buộc):** Copy file `.env.example` tại thư mục gốc thành `.env`:

   Bash

   ```bash
   cp .env.example .env
   ```

   *(Trên Windows PowerShell: `Copy-Item .env.example .env`)*

   Mở file `.env` và điền thông tin secret cần thiết (`JWT_SECRET`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` được cung cấp riêng trong báo cáo/email nộp bài, tuyệt đối không commit `.env` lên Git). Giữ nguyên:

   - `PORT=10000`
   - `FRONTEND_URL=http://localhost:3000`
   - `VNPAY_RETURN_URL=http://localhost:10000/payments/vnpay/return`
   - `NEXT_PUBLIC_API_URL=http://localhost:10000`

3. **Build và khởi chạy toàn bộ 3 dịch vụ (PostgreSQL + API + Web):**

   Bash

   ```bash
   docker compose up --build -d
   ```

   *Container `api` tự động chạy `prisma migrate deploy` để khởi tạo đầy đủ bảng CSDL trước khi lắng nghe ở cổng `10000`.*

4. **Khởi tạo dữ liệu mẫu (Chạy 1 lần cho Database Local mới):**

   Bash

   ```bash
   docker compose exec api npm run seed
   ```

   Lệnh trên nạp đủ: tài khoản mẫu (`user@example.com` / `Password123`), mã ưu đãi `WELCOME5`, 10 đồ uống, 12 nguyên liệu, 100 dòng công thức theo size và 3 công thức topping (`Trân châu`, `Extra shot`, `Kem cheese`).

5. **Truy cập ứng dụng Local:**

   - **Frontend (Next.js):** `http://localhost:3000`
   - **Backend API (NestJS):** `http://localhost:10000`
   - **Health Check:** `http://localhost:10000/health`
   - **Swagger API Docs:** `http://localhost:10000/api/docs`
   - **PostgreSQL Local:** `localhost:5432`

6. **Dừng hệ thống (vẫn giữ dữ liệu trong volume):**

   Bash

   ```bash
   docker compose down
   ```

## 3. Hướng dẫn chạy Local không qua Docker (Dev mode)

1. Tạo file `apps/api/.env` từ `apps/api/.env.example` và `apps/web/.env.local` từ `apps/web/.env.example`.
2. Đảm bảo PostgreSQL đang chạy (có thể bật riêng DB bằng `docker compose up -d postgres`).
3. Tại `apps/api`:

   Bash

   ```bash
   npm ci
   npx prisma generate
   npx prisma migrate deploy
   npm run seed
   npm run start:dev
   ```

4. Tại `apps/web` (mở terminal mới):

   Bash

   ```bash
   npm ci
   npm run dev
   ```

## 4. Hướng dẫn Test & Build

### Backend (`apps/api`)

Bash

```bash
cd apps/api
npm run lint        # Kiểm tra oxlint
npm run test        # Unit Test & Concurrency Integration Test (NFR-01)
npm run test:e2e    # End-to-End Test từ Menu -> Login -> Order -> Payment
npm run build       # Biên dịch NestJS
```

### Frontend (`apps/web`)

Bash

```bash
cd apps/web
npm run lint        # Kiểm tra ESLint
npm run test        # Unit Test Component (ProductCard.test.tsx)
npm run build       # Build Next.js Production (Standalone)
```

## 5. Hướng dẫn Deploy & Rollback

Chi tiết kiến trúc triển khai và 7 bước CI/CD xem tại [`docs/deployment.md`](https://www.google.com/search?q=docs/deployment.md).

- **Deploy tự động:**
  - Khi mở Pull Request vào `develop`/`main`: GitHub Actions chạy `.github/workflows/ci.yml` (Migrate, Seed, Lint, Unit/Integration/E2E Test, Build).
  - Khi merge vào `develop`/`main` hoặc đẩy tag phiên bản `v*` (ví dụ `v1.0.0`): GitHub Actions chạy `.github/workflows/cd.yml` để kiểm tra Quality Gate, build & push Docker image lên GHCR (tag theo Commit SHA / SemVer), kích hoạt deploy Render (tự chạy `prisma migrate deploy`) và chạy Smoke Test kiểm tra `/health`.
  - Frontend tự động build và triển khai trên Vercel qua HTTPS.

- **Rollback khi triển khai thất bại:**
  - **Backend (Render):** Vào Render Dashboard → chọn dịch vụ `brewlite-api` → tab **Deploys** → chọn bản deploy `Live` ổn định gần nhất → bấm **Rollback to this deploy** (hoặc chỉ định lại image theo Commit SHA ổn định trước đó trên GHCR).
  - **Frontend (Vercel):** Vào Vercel Dashboard → chọn dự án `assiment2` → tab **Deployments** → chọn bản `Ready` gần nhất → bấm `...` → **Redeploy** (hoặc **Instant Rollback**).

## 6. Giám sát (Monitoring, Logs & Database)

- **Health Check:** Truy cập `https://brewlite-api-5dmc.onrender.com/health` — trả về HTTP `200` với `{"status":"ok","database":"connected"}`.
- **Logs Backend:** Render Dashboard → `brewlite-api` → tab **Logs** (kiểm tra log `OrdersExpiryJob` và `[VNPay Controller] IPN response`).
- **Logs Frontend:** Vercel Dashboard → `assiment2` → tab **Logs**.
- **Database Production:** Lưu trữ an toàn trên **Neon.tech** (không public cổng trực tiếp, kết nối qua SSL Connection String được quản lý bằng biến môi trường bảo mật).

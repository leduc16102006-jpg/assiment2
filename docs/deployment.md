# Kiến trúc Triển khai & Pipeline CI/CD — BrewLite

## 1. Kiến trúc Triển khai (Deployment Architecture)

Sơ đồ triển khai xem tại `docs/diagrams/DeploymentProduction.svg`.

- **Frontend (`apps/web`):** Triển khai trên **Vercel** (`https://assiment2.vercel.app`), tự động build khi nhánh `develop` được cập nhật, hỗ trợ HTTPS tự động.
- **Backend (`apps/api`):** Đóng gói bằng `apps/api/Dockerfile` (Node.js 20 Alpine), triển khai trên **Render** (`https://brewlite-api-5dmc.onrender.com`), tự động chạy `prisma migrate deploy` trước khi mở cổng API.
- **Database:** PostgreSQL 16 triển khai trên **Neon.tech**, chỉ cho phép kết nối bảo mật qua SSL Connection String (`sslmode=require`), không public thông tin kết nối trong mã nguồn.

## 2. CI/CD Pipeline (GitHub Actions)

### 2.1. Continuous Integration (`.github/workflows/ci.yml`)
Kích hoạt tự động trên mọi Pull Request vào `develop` và `main`:
- Khởi tạo dịch vụ `postgres:16` tạm cho môi trường kiểm thử.
- **Backend (`api-ci`):** `npm ci` → `npx prisma generate` → `npx prisma migrate deploy` → `npx prisma db seed` → `npm run lint` → `npm run test` (Unit + `stock-concurrency.integration.ts`) → `npm run test:e2e` → `npm run build`.
- **Frontend (`web-ci`):** `npm ci` → `npm run lint` → `npm run test` → `npm run build`.

### 2.2. Continuous Delivery (`.github/workflows/cd.yml`)
Kích hoạt khi push/merge lên `develop`, `main` hoặc đẩy tag phiên bản `v*` (ví dụ `v1.0.0`), đáp ứng đủ 7 tiêu chí:

1. **Quality Gate (Lint, Test & Build):** Chạy đầy đủ kiểm tra chất lượng cho cả Backend (có `postgres:16`, migrate, seed, lint, unit/integration test, E2E test, build) và Frontend (lint, test, build).
2. **Đóng gói Docker Image gắn tag chuẩn:** Build image từ `apps/api/Dockerfile` và gắn tag bằng **Commit SHA** (`type=sha,format=long`) và **Semantic Version** (khi đẩy tag `v*`).
3. **Push lên Container Registry:** Đăng nhập và đẩy image lên **GitHub Container Registry (`ghcr.io`)** bằng `GITHUB_TOKEN`.
4. **Triển khai vào Production bằng CI Secrets:** Kích hoạt triển khai Render thông qua `secrets.RENDER_DEPLOY_HOOK_URL` (dùng `curl -fsS -X POST`, không lộ secret trong log).
5. **Chạy Migration an toàn:** Entrypoint của `apps/api/Dockerfile` thực thi `./node_modules/.bin/prisma migrate deploy && node dist/main` — chỉ áp dụng các migration mới chưa chạy, bảo toàn toàn bộ dữ liệu Production hiện có.
6. **Health Check / Smoke Test sau triển khai:** Vòng lặp kiểm tra tự động gọi `${{ secrets.PROD_API_URL }}/health` (tối đa 15 lần, mỗi lần cách 15 giây), chỉ xác nhận đạt khi nhận đủ HTTP `200` và `"database":"connected"`.
7. **Dừng Pipeline & Quy trình Rollback khi thất bại:** Khi Smoke Test thất bại, bước rollback tự động kích hoạt (`if: failure()`), dừng pipeline với mã thoát `exit 1` và cung cấp hướng dẫn quay về bản ổn định trước đó trên Render/Vercel.

## 3. Quản lý Secret & Biến môi trường

Mọi thông tin nhạy cảm (`DATABASE_URL`, `JWT_SECRET`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `RENDER_DEPLOY_HOOK_URL`, `PROD_API_URL`) đều được cấu hình qua **GitHub Actions Secrets**, **Render Environment Variables** và **Vercel Environment Variables**. Các file `.env` và `.env.local` được loại trừ trong `.gitignore`, tuyệt đối không commit lên repository.

### Biến môi trường bắt buộc trên Production
- **Render (`brewlite-api`):** `DATABASE_URL`, `JWT_SECRET`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL`, `VNPAY_RETURN_URL=https://brewlite-api-5dmc.onrender.com/payments/vnpay/return`, `FRONTEND_URL=https://assiment2.vercel.app`.
- **Vercel (`assiment2`):** `NEXT_PUBLIC_API_URL=https://brewlite-api-5dmc.onrender.com`.
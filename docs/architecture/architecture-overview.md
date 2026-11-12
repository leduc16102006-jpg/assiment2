# Task 3 — Tài liệu Thiết kế Kiến trúc Hệ thống (BrewLite)

**Dự án:** BrewLite — Assignment 2: Requirements to Deployment  
**Tham chiếu:** SRS (`docs/requirements/srs.md`), Use-Case (`task1.3-use-case-checkout.md`), Diagrams (`docs/diagrams/`)

---

## 1. Kiến trúc Frontend (Next.js & PWA) — [Phụ trách: Bạn D]
- **Sơ đồ C4 Context & Container:** `![C4 Context & Container](../diagrams/c4-context-container.svg)`
- **Tổ chức phân lớp Next.js:** (Điền mô tả Pages/App Router, Components Mobile-first, `CartContext` + `localStorage`)
- **Cấu hình PWA:** (Điền mô tả `manifest.json`, icons, Service Worker và cách hoạt động trên trình duyệt di động/desktop)
- **ADR liên quan:** [ADR-002: Next.js PWA & Client-side Cart State](./adr/002-nextjs-pwa-and-client-cart.md)

## 2. Kiến trúc Backend (NestJS Modular Monolith) — [Phụ trách: Bạn C]
- **Sơ đồ C4 Backend Component:** `![C4 Backend Component](../diagrams/c4-backend-component.svg)`
- **Kiến trúc phân lớp & Module:** (Điền luồng Request qua Controller -> ValidationPipe -> JwtAuthGuard -> Domain Services -> PrismaService; liệt kê các module `Auth`, `Products`, `Orders`, `Payments`, `Promotions`, `Health`)
- **ADR liên quan:** [ADR-003: Modular Monolith với NestJS](./adr/003-modular-monolith-nestjs.md)

## 3. Cơ sở dữ liệu PostgreSQL & Cơ chế Migration — [Phụ trách: Bạn E]
- **Thiết kế dữ liệu & Ràng buộc:** (Liên kết tới `class-domain.svg` và `backend/prisma/schema.prisma`, nêu các khóa duy nhất `email`, `idempotencyKey`, `orderId` trên `LoyaltyTransaction`)
- **Cơ chế Migration & Seed:** (Giải thích quy trình `prisma/migrations/`, phân biệt `migrate dev` ở Local và `migrate deploy` + `seed` trên Production)
- **Kiểm soát đồng thời (Concurrency):** (Giải thích Database Transaction kết hợp Optimistic Locking bằng cột `version`)
- **ADR liên quan:** [ADR-005: PostgreSQL, Prisma Migration & Optimistic Locking](./adr/005-postgresql-prisma-optimistic-lock.md)

## 4. Kiến trúc Dịch vụ Thanh toán (Mock & VNPay Sandbox) — [Phụ trách: Bạn C]
- **Tách biệt phương thức thanh toán:** (Giải thích luồng đồng bộ cho `WALLET`/`CARD` và luồng bất đồng bộ Redirect + IPN Webhook cho `VNPay Sandbox`)
- **Bảo mật giao dịch & Chống trùng lặp:** (Cơ chế `Idempotency-Key` và xác thực chữ ký `HMAC-SHA512`)
- **ADR liên quan:** [ADR-004: Thanh toán Idempotent & Tích hợp VNPay IPN](./adr/004-idempotent-payment-vnpay.md)

## 5. Logging, Health Check & Quản lý Cấu hình — [Phụ trách: Bạn E]
- **Quản lý cấu hình (Config):** (Sử dụng `ConfigModule` nạp `.env`, tách biệt cấu hình Local và Production Secrets)
- **Health Check:** (Endpoint `GET /health` kiểm tra trạng thái API và kết nối PostgreSQL phục vụ Docker & Render)
- **Logging & Bảo mật dữ liệu nhạy cảm:** (Ghi log lỗi giao dịch, xung đột kho, sai chữ ký IPN; quy tắc che giấu mật khẩu, JWT và Hash Secret)

## 6. Kiến trúc Triển khai Production (Task 3.2) — [Phụ trách: Bạn B]
- **Sơ đồ Deployment:** `![Deployment Diagram](../diagrams/deployment-production.svg)`
- **Ranh giới môi trường (Local — CI — Production):** (Mô tả chi tiết Docker Compose local, GitHub Actions + `ghcr.io`, Vercel CDN và Render Cloud)
- **Giao thức, Cổng kết nối & Lưu trữ bền vững:** (Liệt kê `HTTPS :443`, `TCP :5432` nội bộ, Persistent Disk của PostgreSQL)
- **ADR liên quan:** [ADR-001: Cấu trúc Monorepo & Hạ tầng triển khai Vercel - Render](./adr/001-monorepo-and-deployment.md)

## 7. Ma trận Truy vết Kiến trúc $\leftrightarrow$ Mã nguồn (Traceability) — [Phụ trách: Bạn B]

| Thành phần Kiến trúc / Sơ đồ | Yêu cầu liên kết (Task 1) | ADR | Đường dẫn Mã nguồn thực tế trong Repo |
| :--- | :--- | :--- | :--- |
| Next.js Web App / PWA (Vercel) | FR-01..03, FR-07, NFR-03 | ADR-002 | `frontend/src/app/`, `frontend/src/context/CartContext.tsx`, `frontend/public/manifest.json` |
| NestJS API Container (Render) | FR-04..12, NFR-01..02 | ADR-003 | `backend/src/main.ts`, `backend/src/app.module.ts` |
| Auth & Security Guard | FR-04, NFR-02 | ADR-003 | `backend/src/auth/` (`jwt.strategy.ts`, `jwt-auth.guard.ts`) |
| Orders & Optimistic Stock Lock | FR-05, FR-08, NFR-01, NFR-05 | ADR-005 | `backend/src/orders/` (`orders.service.ts`) |
| Payment & VNPay IPN Service | FR-06, FR-10, NFR-02 | ADR-004 | `backend/src/payments/` (`payments.service.ts`, `vnpay.util.ts`) |
| PostgreSQL & Prisma Migrations | FR-05, FR-12, NFR-04..05 | ADR-005 | `backend/prisma/schema.prisma`, `backend/prisma/migrations/` |
| Health Check & Logging | FR-12, NFR-07 | ADR-001 | `backend/src/health/`, `docker-compose.yml` |
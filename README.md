
# BrewLite — Hệ thống Đặt Đồ uống Trực tuyến (Assignment 2)

Dự án thực hành môn Công nghệ Phần mềm: Từ Đặc tả Yêu cầu, Thiết kế Kiến trúc đến Triển khai CI/CD và Vận hành Production.

---

## 1. Cấu trúc Repository (Monorepo)

```text
brewlite-assiment2/
├── .github/workflows/       # Cấu hình GitHub Actions CI/CD Pipeline (Task 4.4)
├── apps/
│   ├── api/                 # Backend NestJS + Prisma ORM + PostgreSQL (Port 3000)
│   └── web/                 # Frontend Next.js Mobile-First / PWA (Port 3001 -> 3000)
├── docs/
│   ├── requirements/        # Task 1: Context, Scope, SRS, Use Case Specification
│   ├── diagrams/            # Task 2 & 3: Activity, Sequence, Class, C4, Deployment (.puml & .svg)
│   └── architecture/        # Task 3: Architecture Overview, Traceability Matrix & ADRs (001-005)
├── tests/                   # Kịch bản kiểm thử tích hợp & kiểm thử đồng thời (Concurrency)
├── .env.example             # Mẫu biến môi trường (Không chứa khóa bí mật thật)
├── .gitignore               # Danh sách tệp bỏ qua của Git
└── docker-compose.yml       # Khởi chạy môi trường Local (PostgreSQL + Backend + Frontend)
```

| Thành viên | Vai trò | Phụ trách Thiết kế (Task 1–3) | Phụ trách Hiện thực (Task 4–6) |
| --- | --- | --- | --- |
| Bạn B (Lê Vũ Đức) | Scrum Master / DevOps / FE | Task 1.1, Task 3.2 (Deployment Diagram, ADR-001), Traceability | Thiết lập Repo, CI/CD Pipeline, Docker Compose, CartContext, UI Auth & Checkout |
| Bạn C | Backend Developer | Task 1.3 (Use Case Checkout), Task 2.2 (Sequence), Task 3.1 (C4 Backend, ADR-003, ADR-004) | Products API (GET /products, GET /products/:id), Orders API, VNPay IPN & Idempotency |
| Bạn E | Data & Ops / Backend | Task 1.2 (SRS NFRs), Task 2.3 (Class Diagram), Task 3.1 (DB Migration, Health/Logging, ADR-005) | Prisma Schema, Migrations, Database Seed, Auth API, Optimistic Locking (version), GET /health |
| Bạn D | Frontend Developer | Task 1.2 (SRS FRs), Task 2.1 (Activity Diagram), Task 3.1 (C4 Context/Container, ADR-002) | Giao diện Menu Mobile-First, Modal Chi tiết món, trạng thái Loading/Empty/Error, PWA Manifest |

## 3. Chiến lược Branch & Quy trình Pull Request (Git Workflow)

* **main:** Nhánh phát hành ổn định (Production Release).
* **develop:** Nhánh tích hợp chính của các Sprint. Không commit trực tiếp lên main và hạn chế đẩy thẳng code tính năng lên develop.
* **Nhánh công việc (Feature/Docs/Chore Branches):** Tách ra từ develop theo cú pháp:
  * `docs/task-<số>-<mô-tả>` (Ví dụ: `docs/task-3-arch-deployment`)
  * `feat/task-<số>-<mô-tả>` (Ví dụ: `feat/task-4.3-products-api`, `feat/task-4.3-menu-ui`)
  * `fix/<mô-tả>` hoặc `chore/<mô-tả>` (Ví dụ: `chore/task-4.1-repo-setup`)

* **Quy trình Pull Request (PR):**
  1. Thành viên hoàn thành công việc trên nhánh riêng và tự kiểm tra lint/test/build ở máy cá nhân.
  2. Mở Pull Request về nhánh develop, ghi rõ mô tả thay đổi và liên kết tới Issue tương ứng.
  3. Pipeline CI (GitHub Actions) tự động chạy chuỗi Install -> Lint -> Unit Test -> Build.
  4. Scrum Master kiểm tra chéo (Code Review) và chỉ bấm Merge khi CI báo thành công (Pass).

## 4. Quy ước Commit (Conventional Commits)

Mọi commit tuân theo định dạng: `<type>(<scope>): <mô tả ngắn gọn>`

* `feat(api)` / `feat(web)`: Thêm tính năng mới ở Backend hoặc Frontend.
* `fix(api)` / `fix(web)`: Cập nhật xử lý lỗi trong mã nguồn.
* `docs(srs)` / `docs(architecture)`: Thêm hoặc cập nhật tài liệu, sơ đồ UML/C4, ADR.
* `test(api)` / `test(web)`: Bổ sung hoặc cập nhật Unit Test / Integration Test.
* `ci(workflow)` / `chore(repo)`: Cấu hình CI/CD, Docker, cấu trúc thư mục.

## 5. Definition of Done (DoD — Tiêu chuẩn Hoàn thành)

Một hạng mục công việc (Task / User Story) trong Sprint chỉ được chuyển sang trạng thái Done khi thỏa mãn toàn bộ các điều kiện sau:

1. **Truy vết Thiết kế:** Mã nguồn hoặc tài liệu tuân thủ đúng đặc tả SRS (Task 1), sơ đồ UML (Task 2) và quyết định kiến trúc ADR (Task 3).
2. **Chất lượng Mã nguồn:** Chạy qua bộ kiểm tra cú pháp (`npm run lint`) và biên dịch (`npm run build`) không phát sinh lỗi.
3. **Kiểm thử:** Có kiểm thử tối thiểu (Unit Test / Component Test) cho luồng chính và vượt qua toàn bộ test case (`npm run test`).
4. **Bảo mật Cấu hình:** Không chứa khóa bí mật (`JWT_SECRET`, `VNPAY_HASH_SECRET`, `DATABASE_URL` thật) cứng trong mã nguồn.
5. **Tích hợp Liên tục (CI) & Review:** Được tạo Pull Request, vượt qua toàn bộ bước kiểm tra tự động của GitHub Actions CI và được Scrum Master duyệt gộp vào develop.


## 6. Hướng dẫn Khởi chạy Môi trường Local

1. Sao chép tệp cấu hình môi trường mẫu:

   Bash
   ```bash
   cp .env.example .env
   ```

2. Khởi chạy toàn bộ hệ thống bằng Docker Compose:

   Bash
   ```bash
   docker compose up --build
   ```

3. Truy cập các dịch vụ:
   - **Frontend (Next.js):** `http://localhost:3001`
   - **Backend API (NestJS):** `http://localhost:3000`
   - **Swagger API Docs:** `http://localhost:3000/api/docs`

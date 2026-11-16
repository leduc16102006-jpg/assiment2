# Ma trận Truy vết (Traceability Matrix) - BrewLite

| Mã yêu cầu (FR/NFR) | Use-case / User Story | Thiết kế / Sơ đồ (Design/Diagram) | Code / API (Implementation) | Kiểm thử (Testing) |
| :--- | :--- | :--- | :--- | :--- |
| FR-01 | US-01: Khách hàng xem danh sách đồ uống (Menu) | UC-01, Activity-01, Sequence-01 | `ProductsController` <br> `GET /products` | E2E: Lấy danh sách sản phẩm từ menu |
| FR-02 | US-02: Khách hàng đăng nhập hệ thống | UC-02, Activity-02, Sequence-02 | `AuthController` <br> `POST /auth/login` | E2E: Đăng nhập tài khoản test lấy JWT |
| FR-03 | US-03: Khách hàng tạo đơn hàng mới | UC-03, Activity-03, Sequence-03 | `OrdersController` <br> `POST /orders` | E2E: Tạo đơn hàng mới |
| FR-04 | US-04: Khách hàng thanh toán đơn hàng (WALLET/VNPAY) | UC-04, Activity-04, Sequence-04 | `PaymentsController` <br> `POST /payments` | E2E: Thanh toán đơn hàng bằng WALLET |
| FR-05 | US-05: Khách hàng xem lịch sử đơn hàng và 7 trạng thái | UC-05, Activity-05, Sequence-05 | `OrdersController` <br> `GET /orders/me` <br> `GET /orders/:id` | Component Test (Frontend UI), E2E: Kiểm tra lại trạng thái lịch sử đơn hàng |
| NFR-01 | Pipeline CI/CD tự động kiểm tra mã nguồn và triển khai | Deployment Diagram | `.github/workflows/cd.yml`, `ci.yml` | Quality Gate (Lint, Build), Smoke Test (Health Check) |
| NFR-02 | Triển khai Production bằng Docker và bảo mật Secret | Deployment Diagram | `Dockerfile`, `docker-compose.yml`, Vercel, Render | Smoke Test trả về HTTP 200, Rollback Script |
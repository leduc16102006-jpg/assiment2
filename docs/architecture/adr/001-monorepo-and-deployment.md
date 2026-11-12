# ADR-001: Tổ chức mã nguồn Monorepo và Hạ tầng triển khai Vercel + Render

- **Trạng thái:** Đã chấp nhận (Accepted)
- **Ngày:** 12/11/2026
- **Người phụ trách:** Bạn B (Scrum Master)
- **Liên kết yêu cầu:** NFR-04 (Deployability), NFR-06 (CI/Maintainability), Task 1.1 (Mục 5.3)

## 1. Bối cảnh (Context)
Dự án BrewLite bao gồm ứng dụng Frontend (Next.js/PWA), Backend API (NestJS) và cơ sở dữ liệu PostgreSQL. Nhóm phát triển gồm 4 thành viên cần một cấu trúc lưu trữ mã nguồn dễ đồng bộ API contract, chạy kiểm thử tự động qua CI và triển khai lên môi trường Production có hỗ trợ HTTPS, Docker container, lưu trữ bền vững cho DB và quản lý biến môi trường an toàn.

## 2. Quyết định (Decision)
1. Tổ chức toàn bộ mã nguồn (`frontend/`, `backend/`, `docs/`, `docker-compose.yml`) trong một kho lưu trữ duy nhất (**Monorepo**) trên GitHub.
2. Sử dụng **Docker Compose** cho môi trường phát triển cục bộ (Local).
3. Sử dụng **GitHub Actions** kết hợp **GitHub Container Registry (`ghcr.io`)** cho quy trình CI/CD.
4. Triển khai Production phân tách theo đặc thù từng tầng: **Vercel** (phục vụ Next.js/PWA qua CDN & HTTPS) và **Render** (chạy Docker container NestJS API kết nối mạng nội bộ tới Managed PostgreSQL có Persistent Disk).

## 3. Lý do lựa chọn (Rationale)
- Monorepo giúp nhóm quản lý tập trung tài liệu đặc tả, sơ đồ thiết kế và mã nguồn trong cùng một lịch sử Pull Request, đảm bảo tính truy vết xuyên suốt.
- Vercel tối ưu hóa sẵn cho Next.js (tự động cấp SSL, CDN toàn cầu và nhận diện PWA) mà không cần cấu hình reverse proxy thủ công.
- Render hỗ trợ chạy trực tiếp từ `Dockerfile` của NestJS, tích hợp sẵn Health Check endpoint (`GET /health`), Runtime Logs và tách biệt Managed PostgreSQL vào mạng nội bộ riêng tư (không mở cổng 5432 ra Internet).

## 4. Ưu điểm (Pros)
- Khởi chạy toàn bộ môi trường cục bộ chỉ bằng một lệnh `docker compose up --build`.
- Tự động hóa hoàn toàn từ lúc mở PR (Lint, Test, Build) đến lúc deploy lên Production.
- Bảo mật cao: Secrets được tiêm trực tiếp lúc runtime trên cloud; Database không bị lộ trực tiếp ra ngoài.

## 5. Hạn chế & Đánh đổi (Cons & Trade-offs)
- **Hạn chế:** Trên gói miễn phí của Render, container Backend có thể rơi vào trạng thái ngủ (cold start) sau một khoảng thời gian không có truy cập, làm request đầu tiên mất khoảng 20–40 giây để khởi động lại.
- **Biện pháp giảm thiểu:** Thiết lập endpoint `GET /health` nhẹ và cấu hình thông báo trạng thái tải dữ liệu (Loading/Retry) ở tầng giao diện Next.js để người dùng nhận biết rõ khi hệ thống đang khởi động.
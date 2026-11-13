# ADR-001: Cấu trúc Monorepo và Nền tảng Triển khai (Vercel & Render)

- **Trạng thái:** Đã chốt (Accepted)
- **Ngày:** 13/11/2026
- **Người phụ trách:** Lê Vũ Đức (Scrum Master)

## 1. Bối cảnh
Dự án BrewLite cần một giải pháp lưu trữ mã nguồn dễ quản lý cho nhóm 4 người, kèm theo một hạ tầng triển khai Production đáp ứng được Next.js (Mobile-first/PWA), NestJS (Docker) và PostgreSQL có Persistent Storage, đồng thời phải miễn phí/chi phí thấp.

## 2. Quyết định
- Gom chung mã nguồn Frontend và Backend vào một repository duy nhất (**Monorepo**).
- Sử dụng **Vercel** để triển khai Frontend (Next.js).
- Sử dụng **Render** để chạy Backend (Web Service Container kéo image từ **GHCR**) và cơ sở dữ liệu PostgreSQL.

## 3. Lý do lựa chọn
- Vercel tối ưu hóa gốc cho Next.js, tự động cấp HTTPS và CDN toàn cầu.
- Render hỗ trợ chạy trực tiếp Docker Image, cung cấp mạng nội bộ (Internal URL) cho PostgreSQL giúp bảo mật Database khỏi Internet.

## 4. Ưu điểm
- Chỉ cần 1 lệnh `docker compose up` là chạy được toàn bộ hệ thống ở Local.
- Phân tách rõ ràng luồng CI/CD: Vercel tự build Frontend, GitHub Actions tự build Backend và đẩy lên GHCR.

## 5. Hạn chế và Trade-off (Đánh đổi)
- **Hạn chế:** Cấu trúc Monorepo dễ khiến CI chạy lại toàn bộ quy trình build ngay cả khi chỉ sửa một file Markdown. Render gói miễn phí sẽ bị "ngủ đông" (Cold start) nếu không có request sau 15 phút.
- **Đánh đổi:** Nhóm chấp nhận thiết lập filter đường dẫn trong GitHub Actions để tối ưu CI, và chấp nhận request đầu tiên của Backend mất 20-30s khởi động đổi lấy việc tiết kiệm chi phí vận hành.
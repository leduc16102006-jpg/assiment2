
# ADR-002: Next.js PWA và quản lý trạng thái giỏ hàng phía Client

- **Trạng thái:** Accepted
- **Ngày:** 2026-11-13
- **Người phụ trách:** Bạn D
- **Phạm vi:** Frontend Application

## 1. Bối cảnh (Context)

BrewLite sử dụng Next.js và React để xây dựng giao diện đặt món trực tuyến. Người dùng cần có thể xem thực đơn, tùy chỉnh sản phẩm, quản lý giỏ hàng, đăng nhập và thực hiện đặt hàng trên cả thiết bị di động lẫn máy tính.

Trong Assignment 1, Frontend đã được tổ chức theo Next.js App Router. Trạng thái giỏ hàng được quản lý thông qua React Context (`CartContext`) và lưu trữ ở `localStorage` để duy trì dữ liệu khi người dùng tải lại trang.

Assignment 2 định hướng mở rộng trải nghiệm theo mô hình Progressive Web App (PWA), giúp ứng dụng có khả năng cài đặt trên thiết bị và mang lại trải nghiệm gần với ứng dụng di động.

## 2. Quyết định (Decision)

### 2.1. Sử dụng Next.js làm nền tảng Frontend

Tiếp tục sử dụng Next.js với App Router và React để phát triển giao diện BrewLite.

Cấu trúc Frontend được tổ chức theo trách nhiệm:

- **App Router (`app/`):** Quản lý các trang và điều hướng như Menu, Cart, Login, Register, Orders và Order Confirmation.
- **Components (`components/`):** Chứa các thành phần giao diện có thể tái sử dụng.
- **Context (`context/`):** Quản lý trạng thái dùng chung giữa các thành phần giao diện, đặc biệt là giỏ hàng.
- **Lib (`lib/`):** Tập trung các hàm giao tiếp với Backend API.
- **Public (`public/`):** Lưu trữ tài nguyên tĩnh như hình ảnh và biểu tượng.

### 2.2. Định hướng mở rộng theo PWA

Định hướng phát triển Frontend theo mô hình Progressive Web App, bổ sung các thành phần cần thiết:

- Web App Manifest để khai báo tên ứng dụng, biểu tượng và chế độ hiển thị khi cài đặt.
- Bộ biểu tượng phù hợp cho các kích thước màn hình và thiết bị.
- Service Worker để hỗ trợ caching các tài nguyên tĩnh phù hợp và cải thiện trải nghiệm tải ứng dụng.
- Giao diện responsive, ưu tiên trải nghiệm trên thiết bị di động.

PWA không thay thế Backend API. Các chức năng yêu cầu dữ liệu mới nhất như kiểm tra tồn kho, tạo đơn hàng và thanh toán vẫn cần kết nối Backend.

### 2.3. Quản lý trạng thái giỏ hàng phía Client

Sử dụng React Context (`CartContext`) kết hợp `localStorage` để quản lý và duy trì trạng thái giỏ hàng ở phía Frontend.

- React Context cung cấp trạng thái và các thao tác giỏ hàng dùng chung cho các trang, component.
- `localStorage` lưu dữ liệu giỏ hàng để khôi phục sau khi tải lại trang.
- Các thao tác chính gồm thêm sản phẩm, cập nhật số lượng, xóa sản phẩm và tính tổng số lượng, tổng tiền hiển thị.

Dữ liệu giỏ hàng phía Client chỉ phục vụ trải nghiệm người dùng. Backend vẫn chịu trách nhiệm xác thực dữ liệu, kiểm tra tồn kho và tính toán giá trị đơn hàng trước khi ghi nhận giao dịch. Frontend không được xem giá hoặc số lượng lưu ở Client là dữ liệu có thẩm quyền.

## 3. Các lựa chọn được cân nhắc (Alternatives)

| Lựa chọn | Đánh giá |
|---|---|
| Next.js kết hợp React Context và localStorage | Phù hợp với cấu trúc hiện tại, dễ tích hợp và đáp ứng nhu cầu quản lý giỏ hàng của BrewLite. |
| Quản lý toàn bộ giỏ hàng trên Backend | Dữ liệu tập trung hơn nhưng cần API và cơ chế đồng bộ cho mỗi thao tác; tăng độ phức tạp đối với phạm vi hiện tại. |
| Chỉ dùng state cục bộ từng component | Đơn giản nhưng khó chia sẻ và đồng bộ trạng thái giỏ hàng giữa nhiều trang. |
| Phát triển ứng dụng Native riêng | Cần xây dựng và duy trì ứng dụng riêng cho từng nền tảng, vượt quá phạm vi cần thiết của dự án. |

## 4. Hệ quả (Consequences)

### Ưu điểm

- Tận dụng nền tảng Next.js và cấu trúc Frontend hiện có.
- Tái sử dụng trạng thái giỏ hàng giữa nhiều trang thông qua React Context.
- Giữ được dữ liệu giỏ hàng khi người dùng tải lại trang nhờ `localStorage`.
- Định hướng PWA giúp tăng khả năng tiếp cận và cải thiện trải nghiệm trên thiết bị di động.
- Tách biệt trách nhiệm: Frontend quản lý trải nghiệm tương tác, Backend xác thực nghiệp vụ và dữ liệu giao dịch.

### Hạn chế và đánh đổi

- Dữ liệu trong `localStorage` chỉ tồn tại trên trình duyệt và thiết bị tương ứng; không tự đồng bộ giữa nhiều thiết bị.
- Người dùng có thể chỉnh sửa dữ liệu lưu phía Client, do đó Backend phải kiểm tra lại giá, tồn kho và thông tin sản phẩm.
- Service Worker và caching cần được cấu hình cẩn thận để tránh hiển thị dữ liệu cũ hoặc cache nhầm dữ liệu nhạy cảm.
- PWA không đảm bảo toàn bộ chức năng đặt hàng và thanh toán hoạt động ngoại tuyến vì các nghiệp vụ này phụ thuộc Backend và cổng thanh toán.
- Việc bổ sung PWA làm tăng công việc cấu hình, kiểm thử và bảo trì Frontend.

## 5. Tài liệu và mã nguồn liên quan (References)

- `apps/web/`
- `apps/web/components/`
- `apps/web/context/CartContext.tsx`
- `apps/web/lib/api.ts`
- `apps/web/public/`
- `apps/web/package.json`
- `docs/diagrams/c4-context-container.puml`
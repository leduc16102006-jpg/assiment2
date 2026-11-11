# YÊU CẦU PHẦN MỀM RÚT GỌN (SRS) - BREWLITE
Môn học: Công nghệ Phần mềm | Bài tập lớn: Assignment 2

---

## 1. Yêu cầu chức năng (Functional Requirements - FR)

### Nhóm 1: Trải nghiệm khách hàng & Giỏ hàng (Phụ trách: Bạn D)
* **FR-01: Hiển thị danh mục & Menu đồ uống**
  * Mô tả: Hệ thống cho phép khách hàng xem danh sách đồ uống mà cửa hàng kinh doanh, hiển thị theo dạng lưới (Grid). Mỗi sản phẩm hiển thị các thông tin gồm tên món, hình ảnh và giá bán. Khách hàng có thể tìm kiếm sản phẩm theo tên và lọc sản phẩm theo danh mục. Hệ thống cung cấp trạng thái tải dữ liệu (Loading State) và thông báo khi không tìm thấy sản phẩm phù hợp (Empty State).
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): 
      - AC-01.1: Khi truy cập trang Menu, hệ thống hiển thị danh sách sản phẩm theo dạng Grid. Mỗi sản phẩm phải có tên, hình ảnh và giá bán.
      - AC-01.2: Khi nhập từ khóa tìm kiếm, hệ thống chỉ hiển thị các sản phẩm có tên phù hợp với từ khóa.
      - AC-01.3: Khi chọn một danh mục, hệ thống chỉ hiển thị các sản phẩm thuộc danh mục đó.
      - AC-01.4: Khi dữ liệu đang được tải, hệ thống hiển thị trạng thái Loading (Skeleton).
      - AC-01.5: Khi không có sản phẩm phù hợp với từ khóa hoặc danh mục đã chọn, hệ thống hiển thị thông báo "Không có sản phẩm".

* **FR-02: Chi tiết & Tùy biến món (Size & Topping)**
  * Mô tả: Hệ thống cho phép khách hàng xem thông tin chi tiết của sản phẩm và tùy chỉnh món uống trước khi thêm vào giỏ hàng. Khách hàng có thể lựa chọn kích thước (Size), thêm một hoặc nhiều Topping. Giá món được tự động tính toán dựa trên giá gốc và các khoản phụ thu tương ứng với lựa chọn của khách hàng.
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): 
      - AC-02.1: Khi mở chi tiết sản phẩm, hệ thống hiển thị thông tin món và các tùy chọn Size S, M, L. Size S được chọn mặc định, không tính thêm phụ phí; Size M phụ thu 5.000 VNĐ và Size L phụ thu 10.000 VNĐ.
      - AC-02.2: Khách hàng có thể chọn nhiều Topping cho một sản phẩm. Ví dụ: Trân châu phụ thu 7.000 VNĐ và Cream Cheese phụ thu 10.000 VNĐ.
      - AC-02.3: Khi khách hàng thay đổi Size hoặc thêm/bỏ Topping, tổng giá món được cập nhật ngay lập tức mà không cần tải lại trang.
      - AC-02.4: Khi khách hàng nhấn "Thêm vào giỏ hàng", hệ thống ghi nhận sản phẩm cùng Size, Topping và giá tương ứng với các lựa chọn đã thực hiện.

* **FR-03: Quản lý giỏ hàng (Cart)**
  * Mô tả: Hệ thống cho phép khách hàng quản lý các sản phẩm đã lựa chọn trong giỏ hàng, bao gồm thêm sản phẩm, thay đổi số lượng và xóa sản phẩm. Hệ thống tự động tính toán lại thành tiền của từng sản phẩm và tổng giá trị giỏ hàng khi có thay đổi.
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): 
      - AC-03.1: Khi khách hàng thêm sản phẩm từ trang chi tiết, sản phẩm được hiển thị trong giỏ hàng cùng thông tin Size, Topping, đơn giá và số lượng.
      - AC-03.2: Khách hàng có thể tăng hoặc giảm số lượng của từng sản phẩm trong giỏ hàng. Số lượng phải là số nguyên dương.
      - AC-03.3: Khi số lượng sản phẩm thay đổi, thành tiền của sản phẩm được cập nhật theo công thức: Đơn giá × Số lượng.
      - AC-03.4: Khách hàng có thể xóa một sản phẩm khỏi giỏ hàng.
      - AC-03.5: Tổng tiền giỏ hàng được tự động tính lại sau khi thêm, sửa số lượng hoặc xóa sản phẩm.
      - AC-03.6: Khi giỏ hàng không có sản phẩm, hệ thống hiển thị trạng thái giỏ hàng trống và không hiển thị giá trị đơn hàng cần thanh toán.

* **FR-07: Lịch sử đơn hàng cá nhân**
  * Mô tả: Hệ thống cho phép khách hàng đã đăng nhập xem danh sách các đơn hàng đã đặt trước đó, xem thông tin chi tiết của từng đơn hàng và theo dõi trạng thái xử lý đơn hàng.
  * Mức ưu tiên (MoSCoW): Should
  * Tiêu chí chấp nhận (AC): 
    - AC-07.1: Khách hàng đã đăng nhập có thể vào trang Lịch sử đơn hàng để xem danh sách các đơn hàng thuộc tài khoản của mình.
    - AC-07.2: Mỗi đơn hàng trong danh sách phải hiển thị mã đơn hàng, thời gian đặt, tổng tiền và trạng thái hiện tại.
    - AC-07.3: Khi chọn một đơn hàng, hệ thống hiển thị thông tin chi tiết gồm danh sách sản phẩm, Size, Topping, số lượng, đơn giá và tổng tiền.
    - AC-07.4: Hệ thống hiển thị trạng thái hiện tại của đơn hàng theo thông tin được cập nhật từ hệ thống quản lý đơn hàng.
    - AC-07.5: Khi khách hàng chưa có đơn hàng nào, hệ thống hiển thị thông báo phù hợp thay vì danh sách trống không có giải thích.

### Nhóm 2: Nghiệp vụ Đơn hàng, Thanh toán & Bảo mật (Phụ trách: Bạn E)
* **FR-04: Đăng ký, Đăng nhập & Xác thực JWT**
  * Mô tả: ...
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): ...
* **FR-05: Đặt hàng & Khóa tồn kho (Stock Lock)**
  * Mô tả: ...
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): ...
* **FR-06: Thanh toán Idempotent (Ví / Thẻ / VNPay)**
  * Mô tả: ...
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): ...
* **FR-08: Quản lý vòng đời trạng thái đơn (State Machine)**
  * Mô tả: ...
  * Mức ưu tiên (MoSCoW): Must
  * Tiêu chí chấp nhận (AC): ...

---

## 2. Yêu cầu phi chức năng (Non-Functional Requirements - NFR)

### Nhóm Kỹ thuật & Hạ tầng (Phụ trách: Bạn E)
* **NFR-01: Hiệu năng & Xử lý đồng thời (Performance & Concurrency)**
  * Tiêu chuẩn: Thời gian phản hồi API < 500ms; xử lý tranh chấp kho an toàn.
* **NFR-02: Bảo mật hệ thống (Security)**
  * Tiêu chuẩn: Băm mật khẩu Bcrypt, mã hóa JWT, validate DTO đầu vào.
* **NFR-04: Khả năng triển khai & Đóng gói (Deployability)**
  * Tiêu chuẩn: Chạy toàn bộ hệ thống bằng một lệnh Docker Compose.

### Nhóm Trải nghiệm & Giao diện (Phụ trách: Bạn D)
* **NFR-03: Tính khả dụng & Tương thích (Usability & Compatibility)**
  * Tiêu chuẩn: Giao diện Mobile-first, hỗ trợ PWA và tương thích với các trình duyệt web phổ biến.
  Tiêu chí chấp nhận:
    - AC-NFR03.1: Giao diện phải hiển thị đầy đủ nội dung và các chức năng chính trên màn hình điện thoại, máy tính bảng và máy tính mà không xuất hiện thanh cuộn ngang ngoài ý muốn.
    - AC-NFR03.2: Các thành phần giao diện như Menu, chi tiết sản phẩm, giỏ hàng và nút thao tác phải được bố trí phù hợp với kích thước màn hình, đảm bảo người dùng có thể thao tác bằng chuột hoặc cảm ứng.
    - AC-NFR03.3: Ứng dụng phải có khả năng cài đặt dưới dạng PWA trên trình duyệt và thiết bị hỗ trợ tính năng này.
    - AC-NFR03.4: Các chức năng chính phải hoạt động ổn định trên những trình duyệt phổ biến được nhóm lựa chọn để kiểm thử, bao gồm Google Chrome và Microsoft Edge.
---

## 3. Sơ đồ Use-Case tổng quát toàn hệ thống (Phụ trách: Bạn D)
*(Chèn sơ đồ tổng quát từ docs/diagrams/use-case-general.svg)*

![Use Case Tổng quát](../diagrams/use-case-general.svg)
# Task 1.2 — Đặc tả yêu cầu phần mềm (SRS)

**Dự án:** BrewLite — Assignment 2: Requirements to Deployment  
**Ngày:** 11/11/2026
**Công nghệ bắt buộc:** Next.js, NestJS, PostgreSQL  
**Mục đích:** Đặc tả yêu cầu chức năng (FR), phi chức năng (NFR), ưu tiên MoSCoW, tiêu chí chấp nhận và sơ đồ use-case tổng quát.

## 1. Bối cảnh, phạm vi và tác nhân

BrewLite hỗ trợ quy trình **xem menu → xem chi tiết và chọn size/topping → giỏ hàng → đăng nhập → đặt đơn → thanh toán → xem xác nhận và lịch sử/trạng thái**. Frontend phát triển bằng Next.js, backend NestJS và cơ sở dữ liệu PostgreSQL.

| Tác nhân | Trách nhiệm | Phạm vi |
|---|---|---|
| **Khách hàng (Customer)** | Xem menu, tùy chọn món, giỏ hàng, đăng ký/đăng nhập, đặt/thanh toán, xem lịch sử | Trong MVP |
| **VNPay Sandbox (Payment Gateway)** | Thực hiện giao dịch VNPay và phản hồi trạng thái cho BrewLite |
| **Barista / Nhân viên quầy** | Tiếp nhận đơn, cập nhật trạng thái pha chế qua giao diện có phân quyền | **Future / Out-of-scope for MVP** — chưa được triển khai |

### 1.1. Phân loại MoSCoW

| Mức | Ý nghĩa |
|---|---|
| **Must** | Bắt buộc để luồng MVP và tiêu chí nghiệm thu liên quan được đáp ứng |
| **Should** | Nên có nhưng không làm hỏng luồng cốt lõi khi chưa hoàn thành |
| **Could** | Tùy nguồn lực phát triển |
| **Won't (this release)** | Không thực hiện trong phạm vi phiên bản Assignment 2 này |

## 2. Yêu cầu chức năng (FR)

### FR-01 — Xem menu và tìm kiếm đồ uống

**MoSCoW:** **Must**. **Actor:** Khách hàng. **API:** `GET /products`.

Hệ thống hiển thị menu dạng lưới, có tên món, hình ảnh, giá và trạng thái tải dữ liệu; cho phép tìm kiếm/lọc theo nhóm sản phẩm nếu dữ liệu danh mục hỗ trợ.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-01.1 | Menu hiển thị đúng tên, hình, giá cơ bản từ dữ liệu API; tải danh sách thành công qua `GET /products`. |
| AC-01.2 | Tìm kiếm tên và lọc danh mục hoạt động với dữ liệu có sẵn; không có kết quả sẽ thể hiện trạng thái rỗng. |
| AC-01.3 | Trong khi tải hiển thị loading/skeleton; API lỗi có thông báo và khả năng thử lại, không để trang trắng. |

### FR-02 — Xem chi tiết và tùy biến món

**MoSCoW:** **Must**. **Actor:** Khách hàng. **API:** `GET /products/:id`.

Khách xem chi tiết món, chọn size S/M/L, topping và thấy tổng giá tạm tính trước khi thêm vào giỏ. Các mức phụ thu là dữ liệu cấu hình; ví dụ của nhóm: S +0đ, M +5.000đ, L +10.000đ.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-02.1 | Chi tiết sản phẩm hợp lệ hiển thị thông tin đúng; sản phẩm không tồn tại được báo lỗi/404. |
| AC-02.2 | Người dùng chọn được size S/M/L và các topping hợp lệ theo dữ liệu sản phẩm. |
| AC-02.3 | Giá tạm tính cập nhật theo size, topping và số lượng trước khi bấm thêm vào giỏ. |
| AC-02.4 | Backend xác minh lại cấu hình món và giá khi tạo đơn; không chấp nhận giá do client tự sửa. |

### FR-03 — Quản lý giỏ hàng

**MoSCoW:** **Must**. **Actor:** Khách hàng.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-03.1 | Khách thêm món với size/topping, điều chỉnh số lượng và xóa dòng món. |
| AC-03.2 | Tổng tạm tính và số lượng trên biểu tượng giỏ cập nhật ngay khi giỏ thay đổi. |
| AC-03.3 | Giỏ rỗng không được đặt đơn; dữ liệu giỏ được bảo toàn khi người dùng xử lý lỗi thanh toán theo chính sách UI. |

### FR-04 — Xác thực và quản lý tài khoản

**MoSCoW:** **Must**. **Actor:** Khách hàng. **API:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.

Cho phép đăng ký, đăng nhập bằng email/mật khẩu, băm mật khẩu Bcrypt, cấp JWT và bảo vệ route có dữ liệu riêng tư. Yêu cầu thu hồi phiên/token được đưa vào phạm vi đặc tả theo phân công.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-04.1 | Đăng ký với email hợp lệ và mật khẩu đủ điều kiện trả 201; chỉ lưu `passwordHash` (Bcrypt), không lưu mật khẩu gốc. |
| AC-04.2 | Email trùng bị từ chối 409; payload sai bị từ chối 400; không phát sinh bản ghi tài khoản sai. |
| AC-04.3 | Đăng nhập đúng trả JWT cùng dữ liệu tài khoản an toàn; sai email/mật khẩu trả 401; không trả `passwordHash`. |
| AC-04.4 | API có bảo vệ nhận thiếu/sai/hết hạn JWT phải từ chối 401; JWT hợp lệ được xử lý đúng quyền. |
| AC-04.5 | Khi triển khai đăng xuất/thu hồi token, token bị thu hồi không thể tiếp tục truy cập API nhạy cảm; phải có cơ chế thu hồi hoặc tương đương và test. |

### FR-05 — Tạo đơn hàng và kiểm soát tồn kho đồng thời

**MoSCoW:** **Must**. **Actor:** Khách hàng. **API:** `POST /orders`.

Backend tiếp nhận giỏ từ khách đã đăng nhập, kiểm tra DTO, tính lại giá, kiểm tra và trừ/giữ tồn nguyên liệu trong **cùng một database transaction**, sử dụng optimistic locking/điều kiện phiên bản để tránh oversell.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-05.1 | Thiếu hoặc sai `Authorization: Bearer <JWT>` bị từ chối 401. |
| AC-05.2 | Giỏ trống, số lượng `qty <= 0` hoặc sai kiểu dữ liệu bị từ chối 400; `productId` không tồn tại bị từ chối có mã lỗi phù hợp. |
| AC-05.3 | Backend tính lại đơn giá, phụ thu, giảm giá và tổng tiền từ DB; không tin số tiền do client truyền vào. |
| AC-05.4 | Trừ kho và tạo Order/OrderItem cùng transaction; đối chiếu `version`, cập nhật `version + 1`; không đủ nguyên liệu trả lỗi và rollback toàn bộ, không để kho âm. |
| AC-05.5 | Đơn hợp lệ được lưu với `userId`, các dòng đơn, tổng tiền và trạng thái đầu tiên `PENDING`. |
| AC-05.6 | Test PostgreSQL với 5 request đồng thời và tồn kho đủ cho đúng 1 đơn: đúng 1 request thành công, 4 yêu cầu còn lại bị từ chối an toàn, không tồn tại đơn dư hoặc stock âm. |

### FR-06 — Thanh toán và Idempotency

**MoSCoW:** **Must**. **Actors:** Khách hàng; VNPay Sandbox (khi khách chọn VNPay). **API:** `POST /payments`, `POST /payments/vnpay/create`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return` (các endpoint VNPay được xác nhận trong mã nguồn Assignment 1).

Thanh toán hỗ trợ Ví/Thẻ **VNPay Sandbox**. Sử dụng `Idempotency-Key` để tránh tạo giao dịch trùng.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-06.1 | Yêu cầu thanh toán tạo từ người dùng đã xác thực, đúng chủ đơn và trạng thái được phép; thiếu `Idempotency-Key` trả 400. |
| AC-06.2 | Gửi hai lần cùng key cho cùng đơn, cùng phương thức không tạo hai Payment/thanh toán hoặc cộng điểm hai lần; trả kết quả cũ hay phản hồi xung đột khi đang xử lý. |
| AC-06.3 | Dùng lại key với đơn hoặc phương thức khác bị từ chối; có ràng buộc unique trên key trong database. |
| AC-06.4 | Ví/Thẻ mô phỏng hoạt động theo nghiệp vụ; chọn VNPay tạo URL thanh toán và chuyển hướng sang **VNPay Sandbox**, không tự đặt đơn thành `PAID` khi vừa tạo URL. |
| AC-06.5 | Backend ký và kiểm tra dữ liệu VNPay bằng HMAC-SHA512; IPN xác minh chữ ký, merchant, mã giao dịch, số tiền và kết quả trước khi sửa Order/Payment. |
| AC-06.6 | IPN hợp lệ cập nhật đơn/giao dịch atomically; callback lặp lại hoặc thất bại không tạo khoản thu, điểm thưởng hay hoàn kho lặp. |
| AC-06.7 | Return URL dùng hiển thị/điều hướng; màn hình chỉ công bố `PAID` khi backend đã xác nhận và lưu trạng thái, không dựa vào query từ client. |

### FR-07 — Xem lịch sử và trạng thái đơn

**MoSCoW:** **Must**. **Actor:** Khách hàng. **API:** `GET /orders/me`, `GET /orders/:id`.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-07.1 | Khách đã đăng nhập xem được danh sách đơn của chính mình, hiển thị mã, ngày, tổng tiền, trạng thái và chi tiết. |
| AC-07.2 | Người dùng A không đọc được đơn của B; API không tiết lộ dữ liệu đơn của người khác (403/404 theo chính sách). |
| AC-07.3 | Đơn mới hiển thị trạng thái `PENDING`; sau thanh toán, trạng thái được đồng bộ từ backend. |

### FR-08 — Quản lý trạng thái đơn và hoàn kho

**MoSCoW:** **Must**. **Đối tượng nghiệp vụ:** Order/State Machine. **API:** `PATCH /orders/:id/status` phải là endpoint vận hành có kiểm soát quyền, không phải quyền của khách mặc định.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-08.1 | Luồng chính `PENDING → PAID → PREPARING → READY → COMPLETED`; có nhánh `PAYMENT_FAILED`, `CANCELLED` và retry hợp lệ theo bảng chuyển trạng thái. |
| AC-08.2 | Chuyển sai như `PENDING → COMPLETED` hoặc `COMPLETED → PAID` bị từ chối, không sửa trạng thái Order. |
| AC-08.3 | Cập nhật kiểm tra trạng thái hiện tại và thực thi atomically để chống yêu cầu cạnh tranh làm nhảy trạng thái. |
| AC-08.4 | Hủy/thanh toán thất bại hoàn nguyên liệu đúng một lần theo chính sách; retry cần kiểm tra/giữ lại tồn kho nếu đã hoàn. |
| AC-08.5 | Khách thường không thể tự gọi API vận hành để chuyển thành `PAID`, `PREPARING`, `READY`, `COMPLETED`; phải có guard/role hoặc cơ chế bảo vệ tương đương và test.|
| AC-08.6 | Thay đổi trạng thái do VNPay chỉ được thực hiện sau khi backend kiểm tra callback hợp lệ; không nhận trạng thái `PAID` trực tiếp từ request client. |


| **FR-09** | **Khuyến mãi** | **MoSCoW:** **Must** | Mã được kiểm tra hiệu lực, mức giảm, hạn dùng và điều kiện tối thiểu ở backend; mức giảm không vượt tổng đơn. |
| **FR-10** | **Tích điểm khách hàng** | **MoSCoW:** **Must** | Chỉ cộng điểm khi đơn `PAID`; giao dịch trùng/IPN lặp không cộng lần nữa. Công thức điểm được lưu tài liệu/config theo dự án. |
| **FR-11** | **Xác nhận đơn và phản hồi lỗi** | **MoSCoW:** **Must** | Sau thanh toán thành công hiển thị mã đơn, tổng tiền, trạng thái từ backend; lỗi được báo rõ, không tự xóa giỏ vì thanh toán thất bại. |
| **FR-12** | **Health check, database migration/seed** | **MoSCoW:** **Must** | `GET /health` có phản hồi; migration/seed tái tạo được CSDL mẫu an toàn trong môi trường test. |
| **FR-13** | **Barista tiếp nhận/cập nhật pha chế qua giao diện và phân quyền** | **Won't (this release)** | **Future:** Nhân viên có tài khoản/role được phép nhận đơn `PAID` và chuyển `PREPARING`/`READY` theo state machine; khách thường không có quyền. Đây là chức năng tương lai. |

## 3. Yêu cầu phi chức năng (NFR)

### NFR-01 — Hiệu năng và khả năng xử lý đồng thời (phần E)

**MoSCoW:** **Must**.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-NFR-01.1 | **Thời gian phản hồi API trung bình dưới 500 ms** trên dữ liệu mẫu và môi trường test xác định. Đo tối thiểu 20 request/endpoint sau warm-up, công bố cấu hình máy/container/DB và số liệu; thời gian ở trang VNPay không tính vào API nội bộ. |
| AC-NFR-01.2 | Test có 5 request tranh chấp lượng nguyên liệu chỉ đủ 1 đơn: đúng 1 thành công, 4 từ chối an toàn; không có stock âm hoặc đơn vượt kho. |
| AC-NFR-01.3 | Xung đột optimistic lock/transaction trả phản hồi lỗi có cấu trúc, không lưu bản ghi dang dở. |

### NFR-02 — Bảo mật hệ thống (phần E)

**MoSCoW:** **Must**.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-NFR-02.1 | Password được hash **Bcrypt salt rounds 10**; password/hash không xuất hiện trong API response. |
| AC-NFR-02.2 | JWT ký bởi secret được cấu hình an toàn từ môi trường; JWT sai/hết hạn bị từ chối; không commit secrets thật lên Git hoặc log. |
| AC-NFR-02.3 | API nhạy cảm dùng Auth Guard; kiểm tra quyền sở hữu dữ liệu; endpoint trạng thái vận hành không dành cho khách thường. |
| AC-NFR-02.4 | DTO/class-validator chặn input sai tại register/login/orders/payments; payload sai không thay đổi dữ liệu. |
| AC-NFR-02.5 | VNPay IPN xác minh HMAC-SHA512 và thông tin giao dịch trước khi cập nhật trạng thái; Return URL không làm nguồn xác nhận thanh toán đáng tin cậy. |

### NFR-03 — Khả năng sử dụng và mobile-first

**MoSCoW:** **Must** đối với responsive/mobile-first; **Should** với tính năng cài đặt PWA.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-NFR-03.1 | Ở viewport 375×812 và 390×844 px, luồng menu → chi tiết → giỏ → thanh toán → xác nhận không tràn/che nội dung quan trọng. |
| AC-NFR-03.2 | UI có thông báo rỗng/loading/lỗi, nút thao tác rõ ràng; khi hết hàng/thanh toán lỗi người dùng biết cách sửa/thử lại. |
| AC-NFR-03.3 | Tương thích trình duyệt hiện đại được nhóm lựa chọn; nếu phát triển PWA, cần manifest/icon và kiểm thử cài đặt, chưa có thì không tuyên bố đạt PWA. |

### NFR-04 — Khả năng triển khai và tái tạo môi trường

**MoSCoW:** **Must**.

| AC | Tiêu chí nghiệm thu có thể kiểm tra |
|---|---|
| AC-NFR-04.1 | Từ thư mục gốc, cấu hình `.env` theo `.env.example`, chạy **một lệnh `docker compose up --build`** để dựng và khởi chạy frontend Next.js, backend NestJS và PostgreSQL local. |
| AC-NFR-04.2 | Có volume lưu dữ liệu PostgreSQL, health check và quản lý thứ tự khởi động phù hợp; container khởi động lại không làm mất dữ liệu đã ghi. |
| AC-NFR-04.3 | README hướng dẫn cấu hình env, migration, seed, build/test và địa chỉ chạy dịch vụ; một người khác có thể clone và làm theo để chạy demo. |
| AC-NFR-04.4 | Secrets JWT/VNPay/DB không hardcode/commit; cấu hình production qua secrets của nền tảng triển khai. Có bằng chứng kiểm thử chạy Compose và truy cập API. |

### Yêu cầu chất lượng bổ sung không trùng mã nhóm

| ID | Thuộc tính | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| **NFR-05** | Toàn vẹn dữ liệu | **MoSCoW:** **Must** | Order, OrderItem, stock và Payment được cập nhật transaction, rollback đúng khi thất bại. |
| **NFR-06** | CI / bảo trì | **MoSCoW:** **Must** | Quy trình PR chạy lint, test, build; có bằng chứng pipeline pass/fail và quản lý tài liệu trong Git. |
| **NFR-07** | Khả năng quan sát | **MoSCoW:** **Must** | Có `GET /health`, log lỗi vận hành, không in mật khẩu/token/chữ ký VNPay. |
| **NFR-08** | Phục hồi demo | **MoSCoW:** **Should** | Sau khi API restart, có thể kiểm tra health và UI xử lý lỗi kết nối/thử lại có kiểm soát. |

## 4. Sơ đồ Use-case tổng quát (Task 1.2)

![Sơ đồ Use-case tổng quát BrewLite](../diagrams/use-case-general.svg)

- [PlantUML – use-case-general.puml](../diagrams/use-case-general.puml)
- [draw.io – use-case-general.drawio](../diagrams/use-case-general.drawio)
- [SVG – use-case-general.svg](../diagrams/use-case-general.svg)

**Actors:** Khách hàng (chính), VNPay Sandbox (hệ thống ngoài), **Barista/Nhân viên quầy (Future / Out-of-scope for MVP)**.

**Các quan hệ cốt lõi:**

| Từ use-case | Quan hệ | Đến use-case | Giải thích |
|---|---|---|---|
| **Xem chi tiết món** | `«extend»` | **Xem menu** | Từ menu khách có thể chọn xem chi tiết món; việc xem là tùy chọn. |
| **Đặt hàng & Thanh toán** | `«include»` | **Đăng nhập** | Theo phân công nhóm: đơn yêu cầu người dùng đã xác thực. **Về ngữ nghĩa UML, nếu đã đăng nhập thì đây nên được coi là tiền điều kiện, không buộc đăng nhập lại.** |
| **Áp dụng mã giảm giá** | `«extend»` | **Đặt hàng & Thanh toán** | Chỉ xảy ra nếu khách cung cấp mã. |
| **Đặt hàng & Thanh toán** | `«include»` | **Xử lý thanh toán** | Thanh toán là bước bắt buộc của luồng checkout thành công. |
| **VNPay Sandbox** | association | **Xử lý thanh toán** | VNPay chỉ là hệ thống ngoài khi người dùng chọn phương thức VNPay; Ví/Thẻ mô phỏng không gọi VNPay. |
| **Barista (Future)** | association | **Tiếp nhận đơn / Cập nhật pha chế** | Hai chức năng được mô hình hóa để thể hiện mở rộng, **không nằm trong MVP**. |

Các thao tác nội bộ như kiểm tra JWT, ký HMAC, cập nhật stock và xử lý IPN thuộc **đặc tả nghiệp vụ/Sequence Diagram**, không cần biến tất cả thành use-case độc lập.

### 4.1. Truy vết Use-case ↔ FR/NFR

| UC | Chức năng | FR/NFR chính |
|---|---|---|
| UC-01 | Xem menu | FR-01, NFR-03 |
| UC-02 | Xem chi tiết và tùy chọn món | FR-02 |
| UC-03 | Quản lý giỏ hàng | FR-03 |
| UC-04 | Đăng ký / Đăng nhập | FR-04, NFR-02 |
| UC-05 | Đặt hàng & Thanh toán | FR-05, FR-06, FR-08, FR-09, FR-10, FR-11; NFR-01, NFR-02 |
| UC-06 | Xem lịch sử / trạng thái | FR-07, FR-08 |
| UC-07 | Áp dụng mã giảm giá | FR-09 |
| UC-08 | Xử lý thanh toán (VNPay khi được chọn) | FR-06, NFR-02 |
| UC-09 | Tiếp nhận đơn (Future) | FR-13 (ngoài MVP) |
| UC-10 | Cập nhật trạng thái pha chế (Future) | FR-13 (ngoài MVP) |

## 5. Quy tắc nghiệp vụ, ngoại lệ và giới hạn kiểm chứng

1. **Đăng nhập:** Khách phải có phiên hợp lệ trước khi tạo đơn; việc thực hiện đăng nhập lại không bắt buộc nếu JWT còn hiệu lực.
2. **Giỏ hàng và giá:** Số lượng phải hợp lệ; backend tính giá/giảm giá và kiểm tồn kho trước khi tạo đơn.
3. **Đơn và tồn kho:** Các thao tác tạo Order/OrderItem, giữ/trừ nguyên liệu là atomic; từ chối request tranh chấp kho, không oversell.
4. **Thanh toán:** Ví/Thẻ mô phỏng và VNPay Sandbox là các lựa chọn; lưu thông tin Payment cùng idempotency, đối chiếu IPN; không đặt `PAID` chỉ từ Return URL.
5. **Trạng thái và hủy:** State Machine chặn chuyển tiếp sai; hủy/thất bại hoàn tồn kho theo quy tắc được định nghĩa trong backend và không hoàn hai lần.
6. **Quyền vận hành:** Barista thuộc tương lai; API đổi trạng thái không được cho phép khách tự ý sửa trạng thái.

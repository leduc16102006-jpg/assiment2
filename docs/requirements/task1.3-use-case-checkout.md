# Task 1.3 – Đặc tả Use-Case Trọng Tâm
## Tên Use-Case: Đặt và Thanh Toán Đơn Hàng
**Hệ thống**: BrewLite  
**Phiên bản**: 1.0  
**Ngày**: 09/11/2026

---

## 1. Biểu đồ Use-Case (phạm vi chi tiết)
![Sơ đồ Use-Case Đặt & Thanh Toán Đơn Hàng](../diagrams/task1.3-diagram.svg)


---

## 2. Thông tin cơ bản

| Thông tin | Nội dung |
|---|---|
| Tên use-case | Đặt và Thanh Toán Đơn Hàng |
| Actor chính | Khách Hàng |
| Actor/Hệ thống liên quan | Hệ thống BrewLite, Payment Gateway (Mock), Hệ thống điểm thành viên |
| Trigger | Khách hàng nhấn nút **"Đặt hàng"** sau khi hoàn tất chọn sản phẩm trong giỏ hàng |
| Tiền điều kiện | 
1. Khách hàng đã xem menu, chọn sản phẩm (size/topping) và thêm vào giỏ hàng 
2. Đã đăng nhập/tài khoản hợp lệ
3. Giỏ hàng có sản phẩm, tổng tiền 
4. Hệ thống kết nối được cổng thanh toán và dịch vụ điểm thành viên 
5. Hệ thống đã kết nối và có dữ liệu tồn kho nguyên liệu hợp lệ
| Hậu điều kiện — Thành công | 
1. Đơn hàng được tạo với trạng thái **"Đã xác nhận / Chờ xử lý"**
2. Khuyến mãi (nếu có) được áp dụng hợp lệ
3. Thanh toán được ghi nhận thành công qua Payment Gateway
4. Điểm loyalty được cộng vào tài khoản
5. Lịch sử đơn hàng cập nhật, hiển thị trạng thái mới
6. Thông báo xác nhận hiển thị cho khách hàng 
7. Tồn kho nguyên liệu được trừ tương ứng trong cơ sở dữ liệu
8. Giỏ hàng của khách hàng được tự động dọn sạch
| Hậu điều kiện — Thất bại | 
1. Không tạo đơn hàng mới
2. Giữ nguyên trạng thái giỏ hàng
3. Không áp dụng khuyến mãi, không trừ/cộng điểm
4. Thông báo rõ nguyên nhân lỗi 
5. Nếu đã giữ/chốt nguyên liệu trong kho → tự động hoàn trả lại kho khi giao dịch thất bại
| Mã yêu cầu liên kết | REQ-BL-003, REQ-BL-004, REQ-BL-005, REQ-BL-007, REQ-BL-012 |

---

## 3. Mô tả luồng xử lý

### 3.1 Luồng chính — Thành công
| Bước | Thực hiện bởi | Hành động |
|---|---|---|
| 1 | Khách hàng | Truy cập trang thanh toán, xem lại giỏ hàng (sản phẩm, size/topping, tạm tính) |
| 2 | Khách hàng | Nhập/thông tin giao hàng, chọn áp dụng mã khuyến mãi (nếu có) |
| 3 | Hệ thống | Kiểm tra tồn kho nguyên liệu đủ cho toàn bộ sản phẩm trong đơn (sử dụng Database Transaction + Optimistic Lock) |
| 4 | Hệ thống | Thực hiện **Thẩm định khuyến mãi** → mã hợp lệ, tính giảm giá |
| 5 | Khách hàng | Chọn phương thức thanh toán: **Ví điện tử** hoặc **Thẻ** |
| 6 | Hệ thống | Tạo yêu cầu thanh toán gửi đến **Payment Gateway (Mock)** |
| 7 | Khách hàng | Xác nhận thanh toán với thông tin ví/thẻ |
| 8 | Payment Gateway | Xác nhận giao dịch thành công → trả về kết quả cho BrewLite |
| 9 | Hệ thống | Thực hiện **Cộng điểm loyalty** dựa trên giá trị đơn hàng |
| 10 | Hệ thống | Tạo bản ghi đơn hàng, cập nhật lịch sử & trạng thái |
| 11 | Hệ thống | Hiển thị thông báo thành công + mã đơn hàng + điểm đã cộng |

### 3.2 Luồng thay thế
| Mã | Xảy ra tại bước | Tình huống | Xử lý & Kết quả |
|---|---|---|---|
| ALT-01 | 3 | Mã khuyến mãi không hợp lệ / hết hạn | Thông báo "Mã khuyến mãi không khả dụng"; cho phép nhập lại hoặc bỏ qua → tiếp tục bước 4 |
| ALT-02 | 4 | Khách hàng chọn thanh toán bằng điểm loyalty | Tính quy đổi điểm thành tiền; nếu đủ → hoàn tất không qua cổng thanh toán; cộng điểm lại nếu có chính sách |
| ALT-03 | 8 | Tài khoản chưa đủ điều kiện nhận điểm | Bỏ qua bước cộng điểm; ghi chú vào đơn hàng; hiển thị "Điểm chưa đủ điều kiện tích lũy" |

### 3.3 Luồng ngoại lệ
| Mã | Xảy ra tại bước | Tình huống | Xử lý & Kết quả |
|---|---|---|---|
| EX-01 | 5–7 | Kết nối Payment Gateway thất bại / giao dịch bị từ chối | Thông báo "Thanh toán không thành công"; **hoàn trả lại nguyên liệu đã giữ về kho**; giữ nguyên giỏ hàng; cho phép thử lại hoặc đổi phương thức thanh toán |
| EX-02 | 3 | Hệ thống khuyến mãi không phản hồi tạm thời | Thông báo "Không thể kiểm tra mã khuyến mãi, vui lòng thử lại sau"; không áp dụng giảm giá; cho phép tiếp tục thanh toán |
| EX-03 | 8 | Cộng điểm thất bại sau khi thanh toán thành công | Ghi nhận giao dịch thành công nhưng tách riêng lỗi điểm; thông báo "Đơn hàng thành công, điểm sẽ được cập nhật sau"; gửi yêu cầu xử lý thủ công |
| EX-04 | 9 | Lỗi cơ sở dữ liệu khi lưu đơn hàng | Tự động gọi hoàn tiền qua Payment Gateway; thông báo lỗi; không tạo đơn; ghi log chi tiết |
| EX-05 | 3 | Nguyên liệu/sản phẩm trong kho không đủ | Hủy bỏ transaction; thông báo "Sản phẩm hiện không đủ hàng"; giữ nguyên giỏ hàng; hiển thị gợi ý điều chỉnh số lượng |
| EX-06 | Bước bất kỳ cần xác thực | Phiên đăng nhập hết hạn / Token không hợp lệ | Lưu trạng thái giỏ hàng tạm thời; chuyển hướng đến trang đăng nhập với thông báo "Vui lòng đăng nhập lại để tiếp tục đặt hàng" |

---

## 4. Liên kết với Mã Yêu Cầu

| Mã yêu cầu | Nội dung ngắn gọn | Liên quan tại bước |
|---|---|---|
| REQ-BL-003 | Hệ thống hỗ trợ áp dụng mã khuyến mãi khi đặt hàng | 2, 3 |
| REQ-BL-004 | Hỗ trợ thanh toán qua ví nội bộ & thẻ | 4–7 |
| REQ-BL-005 | Tích hợp cổng thanh toán (môi trường giả lập) | 5–7 |
| REQ-BL-007 | Tích lũy điểm thành viên theo giá trị đơn hàng | 8, 10 |
| REQ-BL-012 | Khách hàng xem trạng thái & lịch sử đơn hàng | 9, 10 |
| REQ-BL-013 | Hệ thống kiểm tra và cập nhật tồn kho nguyên liệu khi đặt/hủy đơn | 3, EX-01, EX-05 | 
| REQ-BL-014 | Hệ thống quản lý phiên đăng nhập và xác thực người dùng | EX-06 | 

---

## 5. Tiêu chí Chấp Nhận

### ✅ Hệ thống **LÀM**
- Cho phép xem lại giỏ hàng, nhập thông tin, áp dụng mã khuyến mãi
- Kiểm tra tính hợp lệ của khuyến mãi trước khi tính tiền
- Gửi yêu cầu đến cổng thanh toán và xử lý phản hồi
- Tích lũy điểm loyalty khi thanh toán thành công
- Lưu lịch sử, hiển thị trạng thái đơn hàng
- Thông báo rõ ràng nguyên nhân khi có lỗi

### ❌ Hệ thống **KHÔNG LÀM**
- Không tạo đơn hàng khi thanh toán chưa xác nhận thành công
- Không tự động áp dụng khuyến mãi hết hạn/không tồn tại
- Không cộng điểm cho giao dịch chưa hoàn tất
- Không hiển thị thông tin thanh toán của khách hàng cho bên thứ ba

### 📋 Bộ kiểm thử gợi ý
| Mã TC | Tình huống mong đợi | Kết quả chấp nhận |
|---|---|---|
| TC-1.3-01 | Đặt hàng + áp dụng mã khuyến mãi hợp lệ + thanh toán thành công | Đơn tạo, giảm giá đúng, điểm cộng, lịch sử hiển thị |
| TC-1.3-02 | Nhập mã khuyến mãi sai/hết hạn | Thông báo lỗi, không áp dụng giảm giá, cho tiếp tục |
| TC-1.3-03 | Thanh toán bị từ chối bởi cổng | Không tạo đơn, giữ giỏ hàng, hiển thị lý do |
| TC-1.3-04 | Thanh toán thành công nhưng lỗi cộng điểm | Đơn tồn tại, thông báo rõ, điểm cập nhật sau |
| TC-1.3-05 | Chọn thanh toán bằng điểm loyalty | Quy đổi đúng, hoàn tất đơn, ghi lịch sử |
| TC-1.3-06 | Đặt hàng khi nguyên liệu không đủ trong kho | Thông báo hết hàng, không tạo đơn, giữ giỏ hàng, không trừ kho | 
| TC-1.3-07 | Đặt hàng khi phiên đăng nhập hết hạn giữa chừng | Chuyển về trang đăng nhập, không mất dữ liệu giỏ hàng |  
| TC-1.3-08 | Thanh toán thất bại sau khi đã giữ nguyên liệu trong kho | Nguyên liệu được trả về kho, giỏ hàng nguyên vẹn, có thể thử lại |
---------------------
Ngày 10/11/2026
---------------------

## TASK 1.1 – BỐI CẢNH, STAKEHOLDER VÀ PHẠM VI

## 1. Bối cảnh hệ thống (Business Context)
## 1.1. Giới thiệu hệ thống
BrewLite là hệ thống hỗ trợ đặt món tại cửa hàng cà phê thông qua nền tảng web, hướng đến việc đơn giản hóa và thuận tiện hóa quy trình lựa chọn sản phẩm, đặt hàng và thanh toán của khách hàng. Hệ thống cho phép khách hàng truy cập menu, xem thông tin chi tiết sản phẩm, tùy chỉnh size và topping, quản lý các sản phẩm trong giỏ hàng, thực hiện đặt đơn và thanh toán. Sau khi hoàn tất quá trình đặt hàng, khách hàng có thể theo dõi trạng thái đơn hàng và xem lại lịch sử giao dịch.

## 1.2. Vấn đề nghiệp vụ
Trong hoạt động kinh doanh cà phê, quy trình gọi món truyền thống thường yêu cầu khách hàng trực tiếp đến quầy để xem menu, lựa chọn sản phẩm, trao đổi các yêu cầu tùy chỉnh và thực hiện thanh toán. Quy trình này có thể có một số bất tiện, đặc biệt trong những thời điểm cửa hàng có lượng khách đông.

Một số vấn đề nghiệp vụ có thể được xác định như sau:
- Quy trình đặt món phụ thuộc vào thao tác trực tiếp tại quầy: Khách hàng cần trao đổi với nhân viên để lựa chọn sản phẩm và cung cấp các yêu cầu tùy chỉnh, khiến quá trình gọi món có thể mất nhiều thời gian.
- Khó khăn trong việc quản lý các tùy chọn sản phẩm: Một sản phẩm có thể có nhiều kích cỡ và loại topping khác nhau. Nếu thông tin lựa chọn không được ghi nhận rõ ràng, nhân viên có thể gặp khó khăn khi tiếp nhận và chuẩn bị đơn hàng.
- Áp lực xử lý đơn hàng vào giờ cao điểm: Khi nhiều khách hàng cùng đặt món, nhân viên phải tiếp nhận và xử lý nhiều yêu cầu trong cùng một khoảng thời gian, làm tăng nguy cơ nhầm lẫn thông tin đơn hàng.
- Khó theo dõi trạng thái đơn hàng: Khách hàng có thể gặp bất tiện khi muốn biết đơn hàng đã được tiếp nhận, đang được xử lý hay đã hoàn thành.
- Thông tin đơn hàng cần được quản lý thống nhất: Việc ghi nhận thông tin sản phẩm, số lượng, tùy chọn và thanh toán cần đảm bảo tính chính xác, nhất quán trong suốt quá trình xử lý đơn hàng.
Từ những vấn đề trên, BrewLite được xây dựng nhằm hỗ trợ số hóa quy trình đặt món, giúp khách hàng chủ động hơn trong việc lựa chọn và đặt hàng, đồng thời hỗ trợ nhân viên tiếp nhận và xử lý thông tin đơn hàng một cách rõ ràng, có hệ thống.

## 1.3. Mục tiêu của hệ thống
BrewLite hướng đến các mục tiêu chính sau:
1. Đơn giản hóa quy trình đặt món: Cung cấp quy trình trực tuyến từ xem menu, lựa chọn sản phẩm, quản lý giỏ hàng đến đặt đơn và thanh toán.
2. Nâng cao trải nghiệm khách hàng: Cho phép khách hàng dễ dàng xem thông tin sản phẩm, tùy chỉnh size và topping, kiểm tra tổng tiền trước khi đặt hàng.
3. Hỗ trợ xử lý đơn hàng chính xác: Ghi nhận đầy đủ thông tin sản phẩm, số lượng và các tùy chọn của từng đơn hàng.
4. Tăng khả năng theo dõi đơn hàng: Cung cấp thông tin về trạng thái đơn hàng và lịch sử đặt hàng.
5. Đảm bảo tính nhất quán của dữ liệu: Đảm bảo thông tin đơn hàng, thanh toán và tồn kho được xử lý phù hợp trong các tình huống nghiệp vụ.
6. Xây dựng hệ thống có khả năng triển khai: Phát triển ứng dụng theo kiến trúc và công nghệ được yêu cầu, có khả năng kiểm thử, đóng gói và triển khai lên môi trường production.

## 2. Các bên liên quan (Stakeholders)
| Stakeholder | Vai trò | Mục tiêu | Kỳ vọng |
|---|---|---|---|
| Khách hàng | Người trực tiếp sử dụng hệ thống | Tìm kiếm sản phẩm phù hợp, tùy chỉnh đồ uống và hoàn tất đơn hàng | Giao diện thân thiện, dễ sử dụng trên thiết bị di động; thông tin sản phẩm và giá bán chính xác; lựa chọn size, topping dễ dàng; có thể kiểm tra trạng thái đơn hàng và lịch sử đặt hàng |
| Nhân viên quầy | Tiếp nhận thông tin và thực hiện xử lý các đơn hàng từ hệ thống | Nắm bắt chính xác yêu cầu của khách hàng, hỗ trợ quá trình chuẩn bị và phục vụ đơn hàng. | Thông tin đơn hàng đầy đủ, rõ ràng; các tùy chọn sản phẩm không bị nhầm lẫn; trạng thái đơn hàng được cập nhật kịp thời |
| Quản lý cửa hàng | Giám sát hoạt động kinh doanh và quản lý quá trình xử lý đơn hàng | Theo dõi tình hình đơn hàng, kiểm soát hoạt động phục vụ và quản lý thông tin sản phẩm | Dữ liệu đơn hàng chính xác; có khả năng theo dõi trạng thái đơn; thông tin sản phẩm và giá bán được quản lý thống nhất |
| Giảng viên/Khách hàng nghiệm thu | Đánh giá sản phẩm và kết quả thực hiện dựa trên các yêu cầu được giao | Kiểm tra mức độ đáp ứng yêu cầu nghiệp vụ, chất lượng sản phẩm và quy trình phát triển phần mềm | Tài liệu đặc tả đầy đủ, các sơ đồ thiết kế nhất quán; hệ thống có thể chạy và kiểm thử; có thể thực hiện demo và nghiệm thu các chức năng |
| Nhóm phát triển | Thực hiện phân tích, thiết kế, xây dựng, kiểm thử và triển khai hệ thống | Hoàn thành sản phẩm đáp ứng yêu cầu trong thời gian quy định | Yêu cầu rõ ràng, phạm vi cụ thể; mã nguồn có tổ chức; kiến trúc dễ bảo trì; quy trình quản lý mã nguồn, kiểm thử và triển khai được thực hiện thống nhất |
| Đơn vị thanh toán | Cung cấp dịch vụ xử lý thanh toán hoặc đóng vai trò mô phỏng dịch vụ thanh toán trong phạm vi đồ án | Tiếp nhận và xử lý yêu cầu thanh toán, xác định kết quả giao dịch | Yêu cầu thanh toán hợp lệ; kết quả giao dịch rõ ràng; hỗ trợ xác định các trường hợp thanh toán thành công, thất bại và tránh xử lý trùng lặp |


## 3. Phạm vi hệ thống (Project Scope)
## 3.1. Phạm vi trong MVP (In-scope)
MVP (Minimum Viable Product) là phiên bản sản phẩm khả dụng tối thiểu, bao gồm các chức năng cốt lõi cần thiết để hệ thống có thể vận hành và kiểm chứng giá trị nghiệp vụ.

Các chức năng thuộc phạm vi MVP bao gồm:
| STT | Nhóm chức năng | Mô tả phạm vi |
|---|---|---|
| 1 | Xem menu sản phẩm | Hiển thị danh sách sản phẩm dưới dạng lưới , thông tin cơ bản và giá bán để khách hàng lựa chọn. |
| 2 | Xem chi tiết sản phẩm | Hiển thị thông tin chi tiết của sản phẩm, cho phép lựa chọn kích cỡ (size) và topping. |
| 3 | Quản lý giỏ hàng | Cho phép thêm, xóa và điều chỉnh số lượng sản phẩm trong giỏ hàng; tính toán tổng tiền dựa trên các lựa chọn của khách hàng. |
| 4 | Xác thực tài khoản | Hỗ trợ chức năng đăng ký, đăng nhập và xác thực người dùng bằng JWT. |
| 5 | Đặt hàng | Tiếp nhận thông tin từ giỏ hàng và tạo đơn hàng tương ứng , đặt hàng lưu đơn PENDING |
| 6 | Thanh toán | thanh toán mô phỏng Ví/Thẻ và cổng VNPay , bao gồm các trường hợp thành công và thất bại. |
| 7 | Quản lý và theo dõi đơn hàng | Hỗ trợ xác nhận kết quả đặt hàng, cập nhật trạng thái đơn hàng và xem lịch sử đơn hàng. |
| 8 | Kiểm tra và xử lý lỗi | Kiểm tra dữ liệu đầu vào, xử lý các trường hợp dữ liệu không hợp lệ, sản phẩm hết hàng và thanh toán thất bại. |
| 9 | Giao diện chức năng | hệ thống tập trung vào nền tảng web theo hướng mobile-first/PWA. |
| 10 | Xử lý nguyên liệu | khóa tồn kho nguyên liệu bằng Optimistic Locking . |
| 11 | Khuyến mãi | mã giảm giá & tích điểm loyalty . | 

## 3.2. Các nội dung ngoài phạm vi (Out-of-scope)
Để đảm bảo tập trung vào các chức năng cốt lõi và phù hợp với thời gian thực hiện đồ án, một số nội dung sau không được triển khai trong phạm vi hiện tại:
- Thanh toán tài chính thực tế: Không kết nối trực tiếp với ngân hàng hoặc các cổng thanh toán thực tế; chỉ mô phỏng quy trình thanh toán bằng Ví/Thẻ.
- Dịch vụ giao hàng: Không xây dựng hệ thống quản lý shipper, điều phối giao hàng hoặc theo dõi vị trí giao hàng trực tiếp.
- Quản lý kế toán chuyên sâu: Không triển khai các chức năng kế toán, lập báo cáo tài chính hoặc quản lý hóa đơn điện tử.
- Quản lý chuỗi cung ứng: Không xây dựng hệ thống quản lý nhà cung cấp, nhập hàng và quy trình cung ứng nguyên liệu.
- Ứng dụng trí tuệ nhân tạo: Không triển khai các chức năng dự báo nhu cầu, phân tích hành vi hoặc gợi ý sản phẩm bằng AI.
- Quản lý nhiều chi nhánh: Phiên bản hiện tại không hướng đến việc quản lý đồng thời nhiều cửa hàng.
- Màn hình chuyên sâu cho brista
- thanh toán tiền mặt tại quầy . 

## 4. Các giả định (Assumptions)
| Giả định | Mô tả |
|---|---|
| Phạm vi cửa hàng | BrewLite được xây dựng để phục vụ hoạt động đặt món tại một cửa hàng cà phê trong phạm vi MVP. |
| Thiết bị truy cập | Khách hàng có thiết bị kết nối Internet và trình duyệt web để truy cập hệ thống. |
| Dữ liệu sản phẩm | Thông tin sản phẩm, giá bán, kích cỡ và topping được cung cấp hoặc thiết lập trước bởi cửa hàng. |
| Tài khoản khách hàng | Khách hàng thực hiện đăng ký hoặc đăng nhập để sử dụng các chức năng đặt hàng theo quy định của hệ thống. |
| Dịch vụ thanh toán | Dịch vụ thanh toán được mô phỏng nhằm phục vụ kiểm thử và trình diễn, không thực hiện giao dịch tài chính thực tế. |
| Dữ liệu kiểm thử | Dữ liệu mẫu được sử dụng trong quá trình phát triển, kiểm thử và trình diễn hệ thống. |
| Người dùng nội bộ | Nhân viên quầy và quản lý cửa hàng được giả định có quyền truy cập phù hợp với vai trò và nhiệm vụ của mình. |
| Điều kiện vận hành | Hệ thống hoạt động trong điều kiện kết nối Internet và các dịch vụ phụ thuộc ở trạng thái bình thường. |


## 5. Các ràng buộc (Constraints)
Hệ thống BrewLite phải tuân thủ các ràng buộc về công nghệ, quy trình phát triển, thời gian và triển khai được quy định.
## 5.1. Ràng buộc công nghệ
| Ràng buộc | Mô tả |
|---|---|
| Frontend | Bắt buộc sử dụng Next.js, phát triển theo hướng mobile-first/PWA. |
| Backend | Bắt buộc sử dụng NestJS để xây dựng API và xử lý nghiệp vụ. |
| Cơ sở dữ liệu | Bắt buộc sử dụng PostgreSQL để lưu trữ dữ liệu hệ thống. |
| Đóng gói và triển khai | Sử dụng Docker và Docker Compose để hỗ trợ đóng gói, chạy và triển khai các thành phần của hệ thống. |
| Thanh toán | Triển khai dịch vụ thanh toán mô phỏng (Ví/Thẻ) và tích hợp cổng thanh toán VNPay Sandbox. |

## 5.2. Ràng buộc quy trình phát triển
| Ràng buộc | Mô tả |
|---|---|
| Trình tự thực hiện | Các task phải được thực hiện theo đúng thứ tự từ Task 1 đến Task 5. Task sau chỉ được nghiệm thu khi các tạo phẩm bắt buộc của task trước đã được lưu trên repository và có lịch sử thay đổi rõ ràng. |
| Quản lý mã nguồn | Sử dụng GitHub, Bitbucket hoặc nền tảng tương đương để quản lý mã nguồn; áp dụng chiến lược branch, pull request và quy ước commit. |
| Quản lý tài liệu | Các tài liệu yêu cầu, sơ đồ và kiến trúc phải được lưu trữ trong thư mục docs và quản lý bằng phiên bản. |
| Kiểm soát chất lượng | Pipeline CI phải tự động thực hiện Install, Lint, Unit Test và Build khi mở pull request. Không được merge pull request nếu các bước kiểm tra thất bại. |

## 5.3. Ràng buộc triển khai và bàn giao
| Ràng buộc | Mô tả |
|---|---|
| Môi trường triển khai | Hệ thống phải có phiên bản production có thể truy cập qua HTTPS, kèm URL API và health check. |
| Bảo mật dữ liệu | Database production không được public trực tiếp; các thông tin bí mật như secret và environment variables không được lưu trong repository hoặc xuất hiện trong log CI. |
| Kiểm thử | Phải có unit test cho nghiệp vụ quan trọng, integration test cho API tạo đơn/thanh toán và ít nhất một end-to-end test cho luồng từ menu đến xác nhận đơn. |
| Bàn giao | Phải cung cấp README hướng dẫn chạy, kiểm thử, build, deploy và rollback; đồng thời có release notes và video/demo trực tiếp hệ thống. |

## 6. Các rủi ro ban đầu (Initial Risks)
Trong quá trình phát triển và triển khai BrewLite, nhóm có thể gặp một số rủi ro ảnh hưởng đến tiến độ, chất lượng và khả năng vận hành của hệ thống.
| Rủi ro | Mức độ ảnh hưởng | Biện pháp giảm thiểu |
|---|---|---|
| Yêu cầu nghiệp vụ chưa được xác định đầy đủ hoặc các thành viên hiểu khác nhau về yêu cầu hệ thống. | Cao | Thống nhất yêu cầu, xây dựng tài liệu SRS, use-case và tiêu chí chấp nhận trước khi triển khai. |
| Nhiều khách hàng đặt cùng một sản phẩm trong cùng thời điểm, người dùng gửi trùng request thanh toán , Bán vượt tồn kho khi nhiều khách đặt cùng lúc | Cao | Sử dụng Idempotency-Key ,  transaction & optimistic locking , kiểm soát cập nhật dữ liệu đồng thời và kiểm tra tồn kho ở phía backend. |
| Thanh toán thất bại hoặc một yêu cầu thanh toán được gửi lại nhiều lần. | Cao | Xử lý rõ các trường hợp thanh toán thành công/thất bại và sử dụng cơ chế idempotency để hạn chế giao dịch trùng lặp. |
| Xảy ra lỗi trong quá trình tích hợp giữa frontend, backend và cơ sở dữ liệu. | Trung bình | Thống nhất API contract, kiểm thử tích hợp và quản lý cấu hình môi trường thống nhất. |
| Cấu hình Docker hoặc môi trường triển khai không chính xác. | Cao | Chuẩn hóa cấu hình Docker Compose, kiểm tra môi trường và thiết lập health check. |
| Phân công công việc chưa hợp lý hoặc các thành viên không đảm bảo tiến độ Sprint. | Cao | Phân chia nhiệm vụ cụ thể, theo dõi tiến độ thường xuyên và ưu tiên các chức năng quan trọng. |
| Xuất hiện lỗ hổng trong quá trình xác thực, phân quyền hoặc xử lý dữ liệu người dùng. | Cao | Kiểm tra JWT, validate dữ liệu đầu vào, kiểm soát quyền truy cập và bảo vệ thông tin cấu hình. |
| Mất kết nối Internet hoặc dịch vụ thanh toán mô phỏng bị gián đoạn. | Trung bình | Xử lý lỗi kết nối, thông báo trạng thái phù hợp và đảm bảo hệ thống không ghi nhận sai kết quả giao dịch. |

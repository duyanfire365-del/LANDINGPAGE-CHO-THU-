# Văn bản Telegram, SĐT định dạng và nhu cầu theo khoảng

Mẫu trong ảnh được tách thành tên **Mr Nghĩa**, SĐT **0961129229** (đủ 10 chữ số), loại mặt bằng kinh doanh, ngành siêu thị/cửa hàng tiện lợi, diện tích **100–250 m²**, mặt tiền tối thiểu **5 m**, giữ toàn bộ địa bàn Thanh Xuân/Hà Đông/Hoàng Mai/Thanh Trì cùng các yêu cầu còn lại.

`0961129229`, `096.112.9229`, `0.9.6.1.1.2.9.2.2.9`, số có khoảng trắng/dấu gạch và `+84 (961) 129-229` đều chuẩn hóa thành cùng một SĐT để hỏi trùng đúng hồ sơ. Hỗ trợ chữ số toàn chiều rộng, khoảng trắng Unicode và ký tự ẩn trong bản sao. Không thêm/bịa chữ số nếu số thực sự thiếu: giữ ở contactHint, vẫn lưu khách và cấp mã KH. Hai cách viết của cùng số trong một bài không bị coi là hai khách.

Nhận bullet, khoảng `100-250m2`, `100–250 m²`, mặt tiền tối thiểu, địa bàn các quận và tên/SĐT viết chung dòng. Không lấy toàn bộ câu sau SĐT làm tên. Các giới hạn maxSize/minFrontage được lưu trong JSON dữ liệu và có ô chỉnh ở quản trị. Khớp nguồn không bỏ qua trần diện tích/mặt tiền.

“Budget trên dưới 100 triệu” là xấp xỉ, lưu nguyên ý nghĩa và chờ xác nhận mức tối đa; không tự đặt thành ngân sách cứng <=100 để bắn tin khớp sai. Mức “tối đa 100 triệu” thì lưu trần 100. Tin ngân sách ước lượng vẫn được lưu, không bị từ chối vì chưa có mức trần.

## Lần lỗi đã kiểm tra

Bản ghi `9e676383-5850-4d90-ab53-45ec7438d7a0` ở trạng thái review thực tế có payload.text rỗng, không có media, không có bản trích xuất. Chưa có đủ dữ liệu gốc trong bản ghi để kết luận Telegram không gửi text hay nhánh trước đó làm mất text. Không phải kết luận SĐT 9 chữ số: số trong ảnh đủ 10. Mẫu nguyên văn vẫn được bộ đọc cũ chấp nhận khi chạy trực tiếp, nhưng bộ cũ chưa tách đúng đầy đủ tiêu chí theo khoảng.

Bản sửa chụp văn bản đầu vào trước khi định tuyến, giữ `originalText` và `telegramMessage.text/caption` trong kho riêng; có thể lấy lại từ bản dự phòng nếu trường text không có. Cả text và caption đều được xử lý. Sự kiện Telegram thật sự không có văn bản/tệp sẽ không tạo hồ sơ rỗng hoặc báo nhầm lỗi OCR; chỉ ghi metadata chẩn đoán không có dữ liệu liên hệ. Dữ liệu khách không đưa ra API danh mục công khai.

Bản ghi cũ bị mất text không thể tự khôi phục từ Telegram khi trước đó chưa lưu bản gốc. Có thể phục hồi từ văn bản/ảnh người quản lý cung cấp vào đúng lần nhập, giữ bản payload trước phục hồi. Marker `recoveryEvidence.source=user-screenshot` được bộ phục hồi có xác thực xử lý theo đợt sau khi triển khai. Không giả lập webhook hoặc mở endpoint xử lý khách công khai.

Không thêm API AI, dịch vụ đọc ảnh hay chi phí mới. Kiểm thử: customer-presentation-formats, telegram-flexible-customers (đi qua webhook thật + DB/Telegram giả), customers, customer-filters, customer-compare, three-bots, npm run check. Không gửi Telegram thật khi kiểm thử.

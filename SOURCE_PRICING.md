# Giá thuê từ nguồn Telegram

Nguồn cho thuê có diện tích và giá theo m² được quy đổi sang tổng tiền thuê tháng. Ví dụ: 1.600 m² × 110.000 đồng/m²/tháng = 176 triệu đồng/tháng. Giá dùng cho bộ lọc ngân sách luôn là tổng tiền tháng; đơn giá giữ riêng trong `pricePerM2` (đồng/m²/tháng), `priceBasis=per_m2`.

Hỗ trợ dấu phân cách hàng nghìn, dấu thập phân Việt/Anh, diện tích m²/m2/m^2, đơn giá /m² hoặc /1m², tiền đồng/VND, k/nghìn/ngàn và triệu/tr, cách viết 18tr5 hoặc 18tr500k. Chữ không dấu và một số cách viết tắt/lỗi gõ phổ biến được nhận diện: DT, KX, VP, MBKD, CHDV, CHCC, kho xuog, gia theu. Tên đường Cầu Bướu được chuẩn hóa thành Cầu Bươu; không tự suy diễn quận từ hashtag.

Tiền cọc, phí quản lý, điện nước, hoa hồng và giá sang nhượng không được dùng thay giá thuê. Nếu có cả đơn giá và tổng tháng, hai số phải khớp. Nguồn có nhiều giá/diện tích mâu thuẫn, giá theo năm/ngày/giờ, thiếu đơn vị tiền hoặc loại tiền khác cần được kiểm tra thay vì tự đoán số.

Trình soạn và sửa tin có hai cách nhập giá: tổng triệu/tháng hoặc đồng/m²/tháng. Máy chủ tự nhân diện tích để tính tổng, không tin giá tổng do trình duyệt gửi lên. Xuất Excel/Word/PDF giữ riêng đơn giá; mẫu Excel có cột đơn giá tùy chọn.

Sau khi triển khai Ready, nguồn từng bị giữ lại do lỗi đọc giá có thể gửi lại nguyên nội dung/ảnh vào bot. Cơ chế gửi lại đưa nguồn cần kiểm tra về hàng chờ; tin đã đăng không bị đăng lặp. Hoặc Admin → Nguồn Telegram → Tải nguồn mới → mở tin → Xử lý / Thử lại. Không cần thay SQL hoặc mua API cho chế độ ảnh gửi kèm.

Kiểm thử: `node tests/source-pricing.mjs`, `node tests/source-rules.mjs`, `node tests/source-automation.mjs`, `node tests/telegram-inbox.mjs`, và kiểm thử nền tảng với cấu hình thử cục bộ. Không dùng khóa thật hoặc gọi Telegram/OpenAI thật trong các kiểm thử.

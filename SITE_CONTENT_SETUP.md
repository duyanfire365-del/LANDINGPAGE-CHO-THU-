# Tự sửa FAQ và cuối trang

Đăng nhập `/admin` → mở **Nội dung FAQ, liên hệ & logo cuối trang — tự chỉnh sửa**.

- Sửa tiêu đề, lời giới thiệu, hai nhóm câu hỏi, câu hỏi/trả lời; thêm, xóa, đổi thứ tự. Tối đa 40 câu hỏi. Nội dung là văn bản thuần, không cần code/HTML.
- Sửa tên thương hiệu, giới thiệu cuối trang, địa chỉ, link Google Maps, hotline hiển thị ở FAQ/cuối trang, ghi chú, mạng xã hội, dòng bản quyền và liên kết cuối trang. Thêm/xóa liên kết. Link mạng xã hội để trống sẽ hiện “Sắp cập nhật”. Chấp nhận HTTPS hoặc link nội bộ; không chạy mã JavaScript.
- **Lưu nội dung** mới công khai các thay đổi. **Tải lại** bỏ bản sửa chưa lưu và lấy bản mới nhất. **Khôi phục nội dung mặc định** cần xác nhận, không xóa logo cuối trang riêng.
- Logo cuối trang mặc định tự dùng logo mới đã tải tại phần đầu trang (thay logo cũ vuông). Có thể chọn PNG/JPEG/WebP ≤2 MB, xem trước, nhập mô tả và bấm **Lưu logo cuối trang** để dùng logo riêng; **Dùng logo đầu trang** để đồng bộ lại. Giữ tỷ lệ, nền trong suốt. Ảnh được kiểm tra và tối ưu phía máy chủ như logo đầu trang. Chọn ảnh chưa lưu không thay website. Lưu logo riêng không tự lưu những chữ đang sửa: bấm Lưu nội dung để lưu chữ.

Tải lại trang chủ để nhận bản mới. Chỉ admin được sửa. Kiểm tra phiên bản ngăn ghi đè nếu hai phiên cùng thay. Đăng xuất dọn giao diện quản trị. FAQ trong trợ lý chat dùng nội dung đã sửa, không gán câu trả lời cũ theo vị trí sau khi đổi thứ tự.

Phạm vi: FAQ và cuối trang chủ trong ảnh. Hotline ở các biểu mẫu/những nút liên hệ khác, favicon, ảnh chia sẻ, QR và watermark giữ cấu hình riêng hiện hữu. Không đổi tên miền hoặc các luồng gửi hồ sơ.

Dùng bản ghi riêng `site-content:v1` trong kho server-only đang có, không cần bảng/bucket/dịch vụ trả phí mới. Endpoint công khai chỉ trả nội dung công khai và link ảnh, không trả base64 hoặc dữ liệu riêng. Nội dung tĩnh hiện tại vẫn hiển thị nếu API chưa tải được.

Kiểm thử: `node tests/site-content.mjs`, `node tests/site-content-ui.mjs`, `node tests/website-logo.mjs`, `node tests/website-logo-ui.mjs`, `npm run check`. Kho/ảnh kiểm thử giả, không ghi logo/nội dung thật vào production.

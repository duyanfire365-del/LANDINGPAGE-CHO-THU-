# Kết quả kiểm tra bản đóng gói
- Dùng danh sách tệp cho phép; không sao chép toàn bộ kho mã nguồn hoặc lịch sử Git.
- Không có tệp môi trường thật, thông tin đăng nhập đang hoạt động, dữ liệu quản trị gốc hoặc dữ liệu kinh doanh gốc.
- Không có ảnh gốc: đối chiếu dấu SHA-256 với kho ảnh nguồn; toàn bộ hình minh họa được tạo mới.
- Quét định dạng token Telegram, khóa API thông dụng, JWT, private key và các nhận diện riêng đã biết: không phát hiện trong bản mẫu.
- Mã JavaScript và cấu hình 11 API Vercel: kiểm tra hợp lệ.
- Bản cài thử riêng: tạo khóa mới thành công; mở trang chủ, quản trị, thành viên, trang tin và ảnh mẫu thành công; đăng nhập với mật khẩu mới thành công; khách ẩn danh truy cập API quản trị bị chặn.
- Không dùng khóa/dữ liệu thật của chủ website để thử. Chưa xác nhận kết nối dịch vụ bên ngoài cho tài khoản mới của người học.

Không đưa thư mục thử nghiệm đã sinh khóa vào ZIP. Người nhận cần đọc BAT-DAU-O-DAY.md trước.

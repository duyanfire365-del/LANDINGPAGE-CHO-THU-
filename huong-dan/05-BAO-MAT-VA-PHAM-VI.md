# Phạm vi và dữ liệu riêng
## Được giữ
Khuôn giao diện, mã chức năng, cấu trúc SQL, luật xử lý, tích hợp mẫu, dependency lockfile và giấy phép phông chữ. Có ba tin giả lập và hình minh họa mới. Không có bản xuất cơ sở dữ liệu thật.

## Đã loại khỏi bộ mẫu
- Toàn bộ lịch sử Git, thông tin tài khoản Git, cấu hình triển khai cũ.
- Tệp môi trường, token, khóa API, service account, mật khẩu/hash quản trị gốc, dữ liệu mã hóa gốc.
- Danh sách khách, nguồn chủ nhà/đối tác, hoa hồng, map riêng, ghi chú nội bộ và báo cáo nhập dữ liệu.
- Tin BĐS thực tế, ảnh/tài liệu gốc, logo/banner/QR có nhận diện của chủ website.
- Kho node_modules, đầu ra thử nghiệm, ảnh chụp và tệp tạm.
- Số điện thoại, email, tên miền, tên bot và thông tin nhận diện riêng đã được thay bằng dữ liệu giữ chỗ.

Hai tệp admin-password.json và admin-listings.enc.json trong ZIP là giá trị chưa khởi tạo, không chứa dữ liệu gốc và không đăng nhập được. npm run init mới sinh bộ khóa của người học. QR mặc định của mẫu và thông tin liên hệ là giữ chỗ; phải cấu hình lại trước khi sử dụng.

## Chia sẻ lại đúng cách
Chỉ chia sẻ ZIP nguyên gốc. Sau khi chạy init hoặc nhập dữ liệu thật, thư mục làm việc không còn là bản mẫu sạch. Không nén lại nguyên thư mục đó để gửi lớp học. Khóa service_role, Telegram token, JSON Google và mật khẩu phải được lưu riêng. Nếu lộ khóa thì thu hồi tại nhà cung cấp và cấp lại.

Bộ này giữ thiết kế/chức năng để học; không cam kết dịch vụ ngoài đã hoạt động khi chưa cấu hình và kiểm thử. Kiểm tra phân quyền trên dự án của bạn trước khi nhập dữ liệu cá nhân. Các thư viện và phông chữ vẫn theo giấy phép tương ứng.

# Thay đổi ảnh tin đăng

Quản trị → Khách hàng / Công cụ → Quản lý tin đăng → mở tin → **Thay đổi ảnh tin đăng** hoặc **Sửa nội dung & ảnh**.

- **Thêm ảnh mới**: giữ các ảnh đang có và bổ sung ảnh mới.
- **Thay ảnh này**: chọn ảnh mới thay đúng ảnh đó, giữ vị trí trong bộ ảnh.
- **Thay toàn bộ ảnh**: chọn bộ ảnh mới, bỏ bộ ảnh cũ khỏi bài; video đang có được giữ lại.
- **Bỏ ảnh**: bỏ riêng ảnh khỏi bài. **Bỏ toàn bộ ảnh khỏi bài**: bỏ các ảnh, vẫn giữ video; bài dùng banner minh họa nếu không còn ảnh.
- **Đặt ảnh đại diện**: chuyển ảnh đó lên đầu, dùng cho danh sách, trang chi tiết và ảnh chia sẻ liên kết.
- Bấm **Lưu thay đổi** để áp dụng. **Hủy** hoặc đóng cửa sổ thì bài hiện tại không bị thay đổi. Tin đang đăng cập nhật ngay, không phải duyệt lại.

Chấp nhận JPG/PNG/WebP tối đa 10 MB/ảnh và tối đa 12 ảnh/video trong một bài. Ảnh tải lên được xử lý đóng dấu theo cấu hình website khi hiển thị. Nếu đang tải ảnh, chờ tải xong mới lưu.

Ảnh bỏ khỏi bài không bị xóa tệp nguồn. Ảnh trong kho riêng không còn được tham chiếu bởi bất kỳ bài công khai nào thì khách ẩn danh không truy cập được qua API tệp; người có quyền quản trị/chủ tệp vẫn có thể truy cập. Ảnh đã tải về hoặc đã đăng lên mạng xã hội trước đó không thể thu hồi bằng thao tác này.

Cập nhật giữ mã tin, đường dẫn, trạng thái duyệt và mốc xác nhận còn hàng. Lịch sử cập nhật ảnh chỉ hiện trong phần quản lý kín. Danh sách, trang tin, ảnh xem trước và bộ ảnh chia sẻ lấy từ bộ ảnh đã lưu; bộ đệm chia sẻ trên trình duyệt quản trị được làm mới. Các trang đang mở trên máy khác cần tải lại để nhận dữ liệu mới. Facebook có thể lưu ảnh xem trước liên kết cũ; website không kiểm soát thời gian làm mới bộ đệm của Facebook.

Không cần chạy thêm SQL cho tính năng này. Chỉ quản trị được sửa ảnh qua giao diện/API quản trị; quyền thành viên không được nâng lên.

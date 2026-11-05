# Quyền ảnh theo từng tệp

Admin → Quản lý tin đăng → Sửa nội dung & ảnh / Thay đổi ảnh tin đăng. Mỗi ảnh có ba lựa chọn:

- Công khai: xuất hiện trong thư viện, ảnh đại diện, tải/chia sẻ công khai.
- Chỉ mình tôi: chỉ phiên Admin được xem ảnh đã gắn với bài.
- Thành viên được cấp quyền: Admin và các tài khoản có email được nhập riêng cho ảnh đó. Không tự cấp theo quyền xem địa chỉ/hoa hồng. Bỏ email hoặc chọn Chỉ mình tôi để thu hồi.

Bấm Lưu thay đổi để áp dụng. Chỉ ảnh công khai đầu tiên được dùng làm ảnh đại diện; nếu không có ảnh công khai, website dùng banner. Các tệp gốc vẫn được lưu trong bucket riêng tư.

## Telegram

Gửi ảnh kèm caption `Thêm ảnh #chiminhtoi MB - 0002`, hoặc Reply trực tiếp bài gốc với ảnh và `#chiminhtoi`. Chỉ các ảnh trong lượt gửi này chuyển sang riêng tư; ảnh cũ không đổi quyền. Mã không rõ/trùng hoặc thiếu bài tham chiếu sẽ dừng để đối chiếu, không đoán bài. Gửi ảnh nhạy cảm thành album riêng để cả album được giữ kín.

Ảnh mới không có hashtag được kiểm tra bằng dịch vụ nhận diện đã cấu hình (AI_PROVIDER, OPENAI_API_KEY/OPENROUTER_API_KEY, AI_MODEL; tùy chọn MEDIA_PRIVACY_MODEL để chỉ định model có khả năng nhìn ảnh). Chỉ kết quả rõ ràng, không nhạy cảm mới tự công khai. Sổ đỏ/sổ hồng, giấy tờ/tên chủ sở hữu, số nhà/địa chỉ cụ thể, liên hệ nguồn, kết quả mơ hồ, lỗi mạng/model hoặc thiếu cấu hình đều mặc định Chỉ mình tôi. Không lưu bản chép tên/địa chỉ từ kết quả AI. AI có thể nhận diện sai; Admin luôn có quyền duyệt lại từng ảnh. Hashtag giữ kín không gọi AI.

Ảnh đã có trước bản cập nhật giữ quyền công khai cũ; Admin có thể đổi quyền từng ảnh. Không tự thay đổi hàng loạt kho cũ.

## Máy chủ

`assets.access_data` là nguồn quyền chính, chỉ service_role đọc/ghi qua API máy chủ; không mở RLS/GRANT cho anon/authenticated. Ảnh mới vào kho ở trạng thái riêng tư pending. Các bộ đọc công khai lọc theo quyền hiện tại trong assets, không tin metadata cũ của bài. API tải ảnh kiểm tra lại quyền; ảnh kín được gửi qua proxy private/no-store, không trả signed URL cho trình duyệt. Gallery kín kiểm tra phiên và xóa DOM khi logout/ẩn trang. Chia sẻ làm mới danh sách ảnh công khai và đọc ảnh với public=1, kể cả phiên Admin.

Các URL ký của ảnh từng công khai có hạn tối đa 120 giây theo cơ chế cũ; không thể thu hồi bản ảnh mà người khác đã tải xuống trước khi đổi quyền. Ảnh kín chưa từng công khai không được cấp URL đọc công khai.

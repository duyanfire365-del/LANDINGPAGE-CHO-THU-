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

## Ghi chú Telegram bằng lời thường và lựa chọn 1/0

- `công khai` hoặc `#congkhai`: chủ bot chủ động cho phép công khai các ảnh gửi cùng lượt; không cần AI xác nhận lại.
- `đăng làm ảnh đại diện`, `đặt ảnh đại diện`, `#anhdaidien`: công khai và đặt ảnh đầu tiên trong lượt gửi làm đại diện. Các ảnh khác trong cùng lượt vẫn công khai. Ảnh album đến muộn không thay lại ảnh đại diện đầu tiên.
- `chỉ mình tôi`, `không công khai`, `#chiminhtoi`: giữ kín, ưu tiên hơn lệnh công khai nếu có cả hai.

Để sửa bài cũ, gửi kèm mã tin hoặc Reply bài gốc. Các ghi chú điều khiển được loại khỏi mô tả công khai, bản tin gốc vẫn lưu kín đầy đủ.

Nếu không ghi chú, ảnh rõ ràng và nhận diện an toàn vẫn công khai tự động. Ảnh nghi lộ nguồn hoặc chưa kiểm tra được (kể cả thiếu khóa AI) được giữ kín và bot hỏi riêng từng ảnh: `Đăng công khai = 1` / `Chỉ mình tôi = 0`. Reply trực tiếp đúng câu hỏi. Lựa chọn chỉ áp dụng cho ảnh được hỏi, không phải toàn bài; hết hạn sau 72 giờ. Không có câu trả lời thì tiếp tục giữ kín.

Câu hỏi và lựa chọn lưu bền vững trong notification_log (không thêm bảng/quyền công khai). Câu trả lời cũ không ghi đè lần đã xử lý hoặc quyền đã sửa trong Admin. Lỗi gửi câu hỏi được thử lại qua cơ chế khôi phục bot; không cần gửi lại ảnh hoặc tạo bài mới.

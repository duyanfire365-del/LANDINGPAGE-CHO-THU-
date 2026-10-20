# Mặt tiền, đường rộng, vỉa hè, xác nhận 30 ngày và HOT

Không cần thêm bảng SQL cho các chức năng này. Trường BĐS dùng dữ liệu tin hiện có; các lần xác nhận/HOT được lưu trong nhật ký máy chủ.

## Nhập và sửa thông tin

- Trong form đăng bài và hộp sửa tin có **Mặt tiền (m)**, **Đường rộng (m)** và **Vỉa hè: Chưa xác định / Có / Không**.
- Để trống nếu nguồn chưa cho biết, không điền số 0 thay cho chưa rõ. Số đo nhận dấu chấm hoặc dấu phẩy trong phần đọc bài nguồn.
- Khi dán bài gốc hoặc đọc nguồn Telegram/Docs, hệ thống nhận các cụm như `Mặt tiền 5m`, `đường trước nhà rộng 8m`, `có vỉa hè` hoặc `không có vỉa hè`. Tin không ghi rõ thì không tự suy đoán.

## Chờ xác nhận

- Tin đang **Còn hàng** quá 30 ngày sẽ hiện **Chờ xác nhận**. Mốc tính là ngày đăng hoặc lần xác nhận còn hàng gần nhất.
- Mở tin trong quản trị hoặc bài của chính mình → bấm **Còn hàng** để xác nhận lại. Hệ thống ghi ngày giờ mới và tính lại 30 ngày.
- Có thể chọn **Chờ xác nhận** thủ công. Các tin **Đã cho thuê / Tạm dừng** giữ nguyên trạng thái, không tự quay về còn hàng.
- Tin cũ không lưu được ngày đăng/lần xác nhận sẽ hiện Chờ xác nhận; không gán một ngày đăng giả. Sau khi kiểm tra và bấm Còn hàng, hệ thống có mốc xác nhận thực tế.
- Trạng thái được tính tự động khi đọc dữ liệu website, không phụ thuộc cron. Trang đang mở kiểm tra lại khoảng 5 phút/lần khi hiển thị.
- Các gợi ý nguồn có thể vẫn trả tin đang chờ xác nhận, nhưng ghi rõ phải xác nhận tình trạng còn hàng; không coi là nguồn chắc chắn còn trống.

## Ưu tiên 🔥 HOT

- Chỉ quản trị viên được đánh dấu HOT. Khi tạo bài quản trị, tích **Đánh dấu HOT** trước khi đăng; hoặc mở tin trong thư mục quản lý → bấm **🔥 HOT — ưu tiên đầu danh sách**.
- Bấm lần nữa để tắt. Tin được đánh dấu và đang Còn hàng có nhãn đỏ 🔥 HOT, được ưu tiên đầu danh sách trang chủ trong các kết quả phù hợp bộ lọc.
- Khi tin chờ xác nhận, đã cho thuê hoặc tạm dừng, nhãn/ưu tiên HOT tạm ẩn. Lựa chọn của quản trị vẫn được lưu; xác nhận còn hàng sẽ bật lại ưu tiên nếu chưa tắt HOT.

## Ngày giờ chỉ xem riêng

- Khách không thấy lịch sử ngày giờ trong trang tin hay dữ liệu danh mục công khai.
- Trong quản trị, mở tin → **Ngày giờ đăng / Lịch sử cập nhật**. Thành viên cũng có mục này ở tin của chính mình, kể cả khi không còn quyền đăng bài.
- Quản trị xem được tất cả; thành viên khác không được mở lịch sử tin của người khác, kể cả biết đường dẫn. Lịch sử nguồn chung trước đây chỉ quản trị được xem.
- Giờ hiển thị theo Việt Nam. Mốc cũ chưa lưu sẽ ghi **Chưa lưu ngày giờ**, không tự bịa ngày đăng. Những lần xác nhận trạng thái, bật/tắt HOT và đăng/duyệt mới tiếp tục được ghi lại.

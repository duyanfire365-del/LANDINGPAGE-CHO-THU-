# QR Zalo, dấu ảnh và trạng thái nguồn hàng

## Đặt đúng ảnh QR Zalo của chủ website

Sau khi Vercel triển khai bản mới Ready:

1. Đăng nhập /admin → tab **Đóng dấu ảnh**.
2. Trong **QR Zalo mặc định cho toàn website**, chọn ảnh QR Zalo PNG/JPG/WebP của anh (tối đa 2 MB, vuông/gần vuông, tối thiểu 120 px).
3. Bấm **Đặt làm QR mặc định** một lần. Tải lại trang website để thấy bản cập nhật.

Mã QR mặc định khi chưa tải ảnh riêng là QR chuẩn dẫn tới https://zalo.me/0906215365. Không tuyên bố đó là ảnh QR có logo/hoa văn riêng anh gửi trong cuộc trò chuyện. Chọn ảnh QR gốc trong bước trên để hệ thống dùng đúng ảnh đó, không tái tạo hoa văn bằng AI.

Ảnh QR gốc được lưu trong bucket Supabase riêng; cấu hình hiện hành ghi trong notification_log với kind branding-qr và sent=true. Chỉ admin được thay đổi QR mặc định, thành viên không được đổi QR chung. Không cần chạy SQL mới hoặc thêm biến môi trường.

## Dấu ảnh tự động

- Mã BĐS ở trên trái; QR nhỏ ngay dưới mã, khoảng 14% chiều rộng và tối đa 200 px. QR giữ nền trắng và độ tương phản để quét được; không làm QR mờ. Nên mở ảnh đầy đủ để quét thay vì ảnh thu nhỏ.
- Góc dưới phải: 0906215365 và Nguonchothue.vn bên dưới, dạng mờ nhẹ.
- Không đổi ảnh nguồn hay thêm thông tin địa chỉ riêng vào ảnh. Mã BĐS là mã công khai.
- 60 ảnh tin tĩnh và banner đã tạo lại từ bản gốc thành phiên bản qr-web-v2, tránh chồng lên dấu phone-v1 cũ.
- Ảnh Supabase đã có/mới tạo bản có dấu theo id, mã BĐS và revision QR. Khi QR mặc định thay đổi, ảnh tự tạo bản mới dùng QR mới; bản gốc giữ nguyên. Bản có dấu được dùng lại, không tạo ảnh AI hoặc gọi API trả phí.
- Tin tĩnh: catalog chuyển ảnh hiển thị/chia sẻ sang endpoint static-view khi có QR riêng. Tải ảnh và metadata ảnh xem trước dùng cùng cơ chế thay QR; chỉ thay vùng QR, không đóng số điện thoại/tên miền chồng lên ảnh đã có dấu. Bộ dữ liệu tĩnh và URL bài giữ nguyên.
- Thay QR chung áp dụng cho ảnh tự động. Ảnh đã được người đăng chủ động đóng dấu thủ công giữ lựa chọn riêng, không bị ghi đè. Bản ảnh đã gửi ra ngoài hoặc được Zalo/Facebook lưu đệm không thể thu hồi/cập nhật từ website; bản tải/chia sẻ mới sẽ dùng cấu hình hiện hành.

## Đóng dấu thủ công

Admin: tab **Đóng dấu ảnh**, hoặc **Nhập tài liệu / Đăng tin → Đóng dấu ảnh thủ công**.

Sale/CTV đã được cấp quyền: **Không gian thành viên → Chuẩn bị tin đăng → Đóng dấu ảnh thủ công**.

1. Chọn 1–10 ảnh gốc JPEG/PNG/WebP, mỗi ảnh tối đa 10 MB và 40 triệu pixel.
2. Điền mã tin nếu đã có; có thể bỏ trống với tin chưa được cấp mã.
3. Chọn các dấu muốn chèn: QR Zalo, số điện thoại, website. Có thể tải QR riêng cho riêng những ảnh đang xử lý; nếu không chọn, dùng QR mặc định toàn web.
4. Bấm **Chèn dấu và xem trước**.
5. **Tải ảnh đã đóng dấu**, hoặc **Dùng ảnh này cho bài đăng** trong trình soạn.

Xử lý thủ công trên trình duyệt, ảnh gốc trên thiết bị không bị ghi đè. Khi dùng ảnh có dấu trong bài, file được đánh dấu manual-branded để máy chủ không đóng thêm một lớp dấu. Nếu tải ảnh rồi dùng lại, giữ tên tệp nguonchothue-branded-... để trình tải nhận diện được. Để thay lựa chọn đóng dấu, chọn lại ảnh gốc; không thể tự xóa dấu đã ghép vào pixel của một ảnh tải về.

## Trạng thái nguồn hàng

Ba lựa chọn: **Còn hàng**, **Đã cho thuê**, **Tạm dừng cho thuê**.

- Admin đổi được trạng thái nguồn tĩnh trong **Nguồn BĐS riêng**, và nguồn động trong **Duyệt tin**.
- Sale/CTV đang được cấp quyền chỉ đổi được tin chính mình đã gửi trong **Tin của anh/chị**. Không thay đổi quyền duyệt bài, không sửa được tin của người khác hay nguồn chung.
- Trạng thái là thông tin vận hành riêng với Chờ duyệt/Đã đăng/Không duyệt. Đánh dấu đã cho thuê không xóa tin hoặc tái sử dụng mã cũ.
- Nhãn trạng thái hiện trên thẻ, cửa sổ chi tiết và trang riêng. Khách tải lại trang để nhận trạng thái mới. Tin chưa được đánh dấu mặc định Còn hàng; ghi chú cần xác nhận hiện trạng vẫn giữ.
- Trạng thái lưu bền vững trong notification_log, kind inventory:available/rented/paused, record_id là slug, sent=true; lấy bản mới nhất theo created_at/id. Bản ghi này không đi vào danh sách thông báo Telegram lỗi. Bảng đã được bảo vệ server-only trong setup SQL hiện hành.
- Xuất tin Excel/Word/PDF có thêm cột Tình trạng nguồn hàng.

## Kiểm chứng và giới hạn triển khai

Kiểm thử pixel và giải mã QR sau nén JPEG; kiểm thử thay QR riêng vào ảnh đã có, cache theo revision, tải ảnh tĩnh/ảnh Supabase; kiểm thử trình duyệt công cụ thủ công và đưa ảnh vào trình soạn; kiểm thử quyền đổi trạng thái/QR và ba định dạng xuất.

Các phép thử dùng Supabase/Telegram giả lập, không dùng thông tin kết nối Production. Chưa xác nhận Vercel Ready hoặc cấu hình QR thật trong cơ sở dữ liệu người dùng. Cần thao tác đặt QR riêng một lần trong admin để áp dụng đúng ảnh QR người dùng đã gửi.

## Cập nhật giao diện quản trị và dấu ảnh

- Thanh quản trị có bốn khu vực: Nguồn BĐS riêng; Tin trên website; Nguồn Telegram; Khách hàng / Công cụ.
- Nguồn riêng và tin trên website được gom theo danh mục, tìm kiếm, lọc khu vực/trạng thái, tối đa 10 tin/trang. Bấm dòng tin để mở địa chỉ riêng, hashtag và các thao tác.
- Tin trên website có nút Sửa nội dung tin: admin sửa diện tích, giá, mô tả, địa chỉ riêng và hashtag. Giữ nguyên mã, đường dẫn, ảnh và trạng thái duyệt. Nguồn tĩnh ban đầu vẫn có điều khiển trạng thái và chia sẻ.
- Nguồn Telegram thu gọn từng tin và chia 10 nguồn/trang.
- Banner chỉ đặt QR nhỏ ở góc trên phải; không chèn SĐT hoặc website mờ lên banner. Không dùng bố cục góc trên trái của ảnh bài đăng cho banner.
- Ảnh bài đăng thêm SĐT và website mờ ở giữa; ảnh cũ được tạo lại từ bản gốc. Công cụ thủ công có tùy chọn riêng cho dấu giữa ảnh. Dấu không ngăn tuyệt đối việc sao chép hoặc xóa ảnh.
- Mục Kết nối lưu hồ sơ và Telegram có hướng dẫn tạo bot báo khách mới từ đầu. Chỉ thay TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID; giữ nguyên cấu hình bot nhận nguồn.

- Công cụ thủ công có ô Số điện thoại riêng / bổ sung. Giữ chọn số mặc định để vẽ cả hai số; bỏ chọn để chỉ vẽ số riêng. Áp dụng cả góc và giữa ảnh, không tự đổi QR mặc định.

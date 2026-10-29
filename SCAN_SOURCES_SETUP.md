# Cổng nguồn quét Web & Facebook

Truy cập `/admin` → đăng nhập → **Khách hàng / Công cụ** → **Cổng nguồn quét Web & FB**.

1. Tải mẫu Word, Excel, PDF hoặc text, điền link và up tệp; hoặc dán trực tiếp từng link / nhiều link, mỗi link một dòng.
2. Bấm **Đọc tệp & kiểm tra link** hoặc **Kiểm tra danh sách**. Xem số link hợp lệ, trùng và lỗi. Word/Excel/PDF đọc được cả hyperlink gắn vào chữ. Công thức Excel chỉ đọc URL HYPERLINK dạng chuỗi tĩnh; không thực thi macro/công thức.
3. Bấm **Thêm … link hợp lệ** để lưu các link trong bản xem trước. Tệp gốc và ghi chú không được lưu; chỉ lưu link đã chuẩn hóa. PDF có văn bản hoặc link gắn dưới chữ được đọc trực tiếp; PDF ảnh scan không có link cần OCR/chuyển sang văn bản, PDF khóa mật khẩu cần mở khóa trước. PDF tối đa 100 trang, không âm thầm bỏ qua trang cuối. Tối đa 2 MB/tệp, 500 link/lượt, 1.000 nguồn đã lưu. .doc/.xls cũ cần chuyển sang .docx/.xlsx; không hỗ trợ tài liệu có mật khẩu. Text dùng UTF-8 hoặc UTF-16LE có BOM.
4. Lưu lịch theo múi giờ Việt Nam: 05:30, 10:30, 13:30, 15:30, 17:30, 20:00, 22:00. Có thể sửa, thêm/bớt giờ. Lịch ban đầu tắt.
5. Tạm dừng/chọn lại/xóa từng nguồn, tìm kiếm và xuất danh sách .txt. Link trùng được bỏ qua, không ghi đè danh sách cũ. Khi hai người sửa đồng thời, hệ thống yêu cầu tải lại để tránh mất dữ liệu.

## Trạng thái vận hành

**Đây là cổng tiếp nhận và lưu cấu hình, chưa kích hoạt quét tự động.** Phần chạy Python ở bản trước chưa được nối vào website này. Checkbox lịch chỉ lưu ý định chạy sau khi máy quét sẵn sàng. Giao diện luôn hiển thị rõ chưa có máy quét hoạt động.

Website có trạng thái **chờ kiểm tra bộ đọc**. Link Facebook có trạng thái **cần kết nối đọc bài**. Không tự truy cập các URL vừa tải lên trong bước nhập danh sách; không dùng cookie cá nhân, vượt đăng nhập hoặc đọc nhóm kín.

Sau khi anh up danh sách: kiểm tra cấu trúc/robots/quyền từng website, kết nối máy quét chạy nền và bộ hẹn giờ, kiểm tra quyền Facebook hoặc nguồn cấp được phép, rồi mới bật vận hành. Khi đó mới thử luồng dữ liệu nguồn/khách → website → Telegram. Chưa thay đổi cron hoặc đăng ký dịch vụ trả phí trong bản cập nhật này.

## Lưu trữ và quyền

Dùng bảng server-only `notification_log` đã có (kind `scan-sources:v1`, id riêng), theo mẫu cấu hình `share-destinations`. Không thêm bảng hoặc thay đổi RLS. Các API `GET /api/workspace?view=scan-sources` và POST action `scan-*` chỉ cho quản trị đăng nhập; giữ kiểm tra same-origin và giới hạn request. Chỉ server giữ service role. Không thay đổi dữ liệu tin BĐS/khách hàng và không tự đăng bài công khai.

Kiểm thử: `node tests/scan-source-pdf.mjs`, `node tests/scan-sources.mjs`, `node tests/scan-sources-ui.mjs`, `npm run check`. Kiểm thử sử dụng tài liệu giả và kho dữ liệu giả, không nhập link thử vào danh sách production. Truy vấn RLS production chỉ kiểm tra quyền, không đọc nội dung nguồn của anh.

## Bố cục danh sách nguồn

Nguồn được chia thành hai cột Website và Group FB, số thứ tự riêng theo từng loại. Mặc định 20 nguồn/trang, phân trang độc lập cho mỗi cột, hoặc chọn Hiện tất cả danh sách. Tìm kiếm áp dụng cả hai cột, trở về trang 1 và giữ số thứ tự của nguồn trong từng loại để đối chiếu. Khi xóa hết nguồn ở trang cuối, tự lùi về trang còn dữ liệu. Trên điện thoại hai cột xếp dọc. Chuyển trang/tìm kiếm/chế độ hiển thị chỉ thay đổi giao diện, không ghi hay xóa dữ liệu nguồn.

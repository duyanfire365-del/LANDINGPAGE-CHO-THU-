# Quản trị đăng ngay, cấp quyền đăng tự động cho từng thành viên

Quản trị viên gửi tin hợp lệ từ mục đăng bài sẽ đăng ngay, không cần tự duyệt lại. Thành viên mặc định vẫn chờ duyệt. Chỉ tài khoản Sale/CTV được quản trị cấp riêng quyền tự đăng mới có tin lên thẳng website. Việc tự đăng vẫn kiểm tra dữ liệu, thông tin riêng tư và quyền sở hữu ảnh.

## Bật phần cấp quyền thành viên một lần

1. Mở [009_member_auto_publish.sql](https://github.com/duyanfire365-del/LANDINGPAGE-CHO-THU-/blob/main/database/009_member_auto_publish.sql) → sao chép toàn bộ nội dung.
2. Vào Supabase → đúng dự án website → **SQL Editor → New query**.
3. Dán nội dung → bấm **Run**. Thấy **Success. No rows returned** là hoàn tất. SQL chỉ thêm cột quyền; không xóa bài, không tự cấp quyền cho thành viên cũ.
4. Chờ Vercel triển khai mã mới báo **Ready**, tải lại trang quản trị.

Phần quản trị đăng ngay không cần cột mới này. Nếu chưa chạy SQL, thành viên vẫn chờ duyệt và giao diện sẽ báo cần chạy SQL khi anh thử cấp quyền tự đăng.

## Cấp đúng người

1. Quản trị → **Khách hàng / Công cụ → Thành viên**.
2. Tìm đúng họ tên, email, số điện thoại của người muốn cấp.
3. Nếu chưa được gửi tin: bấm **Cấp quyền gửi tin**.
4. Trong cột **Chế độ duyệt từng thành viên**, chọn một trong hai:
   - **Quản trị duyệt từng tin**: mặc định, mỗi tin vào hàng chờ.
   - **Cho phép đăng tự động**: tin hợp lệ của đúng người đó sẽ đăng ngay.
5. Bấm **Lưu chế độ đăng** ở chính dòng tài khoản đó. Thành viên tải lại trang để thấy nhãn/nút tương ứng.

Muốn ngừng đăng thẳng: đổi lại **Quản trị duyệt từng tin**, lưu. Muốn ngừng cả việc gửi bài: **Thu hồi quyền**; thao tác này cũng xóa quyền tự đăng. Cấp lại quyền gửi tin sau đó không tự khôi phục quyền đăng thẳng. Các bài cũ đang chờ không được tự duyệt hàng loạt khi đổi quyền.

## Dán bài gốc

- Bài đã đủ chi tiết: giữ các đoạn và chi tiết hữu ích của bản gốc, chỉ loại thông tin nguồn/địa chỉ đầy đủ/hoa hồng/Map/hashtag/số liên hệ riêng khỏi phần công khai. Không gọi AI để rút gọn bài đầy đủ.
- Bài sơ lược: trau chuốt thành các đoạn dễ đọc, giữ thông số có bằng chứng; thêm lời mời tư vấn và hẹn xem, không thêm tiện ích, pháp lý, nội thất hay giá/diện tích chưa có.
- Hệ thống chỉ điền ô trống. Nếu mô tả cũ đã có chữ và anh muốn dùng bản mới, xóa ô mô tả đó rồi bấm xử lý bài gốc lại. Bài gốc vẫn được lưu trong dữ liệu riêng khi gửi tin.
- Mô tả tối đa 3.000 ký tự; bài vượt giới hạn sẽ có thông báo để anh kiểm tra phần được giữ.

Các luồng nhập Google có lựa chọn tự đăng/chờ duyệt riêng vẫn dùng cấu hình lệnh đã lưu. Việc đổi quyền thành viên chỉ áp dụng việc gửi bài từ tài khoản đó, không thay cấu hình bot hoặc lệnh Google.

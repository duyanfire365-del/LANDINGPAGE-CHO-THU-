# Xóa và duyệt bài đã xóa

Không cần SQL mới cho chức năng xóa tin.

- Quản trị → Tin trên website → mở tin → **Xóa bài đăng**, ngay cạnh **Sửa nội dung & ảnh**. Có bước xác nhận và lý do tùy chọn.
- Thành viên → Tin của anh/chị → **Xóa bài đăng**. Chỉ xóa được tin của chính mình, kể cả khi quyền gửi tin đã bị thu hồi.
- Tin ẩn ngay khỏi danh mục công khai và nguồn gợi ý khách. Bản tin, mã, ảnh và thông tin riêng được giữ nguyên.
- Quản trị → **Duyệt bài đã xóa**: có lọc chờ duyệt/đã duyệt/tất cả, tìm theo mã, tiêu đề, địa chỉ, người xóa và thời gian xóa. Kho duyệt tải theo trang để không bỏ sót tin cũ ngoài 500 tin quản lý gần nhất.
- **Khôi phục tin** đưa tin về trạng thái trước khi xóa: tin đã công khai được công khai lại, tin chờ duyệt vẫn chờ duyệt. Nội dung riêng tư không hợp lệ sẽ bị chặn công khai.
- **Duyệt xóa — giữ trong lưu trữ** xác nhận quyết định xóa, vẫn giữ bản lưu để đọc lại và khôi phục về sau; không xóa vĩnh viễn ảnh hoặc dữ liệu.
- Không dùng nút duyệt đăng hoặc sửa bài để bỏ qua luồng khôi phục. Lệnh Telegram bổ sung dữ liệu cho tin đã xóa yêu cầu quản trị khôi phục trước.
- Google Sheets cập nhật sau thao tác khi kết nối đã cấu hình: cột Trạng thái đăng ghi “Đã xóa — chờ duyệt” / “Đã duyệt xóa”; bản xuất quản trị kèm người xóa, thời gian và lý do.

Thông tin duyệt xóa chỉ dành cho quản trị; thành viên chỉ thấy trạng thái xóa của tin của mình. Lịch sử tin ghi thao tác yêu cầu xóa, duyệt xóa và khôi phục. Không có tác vụ tự xóa theo thời gian.

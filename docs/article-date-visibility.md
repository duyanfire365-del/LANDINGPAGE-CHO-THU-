# Ngày đăng bài theo quyền tài khoản

Áp dụng chung Tin tức Hot và Kinh nghiệm tìm MBKD, danh sách và chi tiết. Khách chưa đăng nhập, tài khoản khách hàng, thành viên bị thu hồi quyền đăng và phiên không hợp lệ không nhận publishedAt/updatedAt trong API công khai; HTML chi tiết không có ngày đăng. Admin và thành viên sales có can_post=true được xem ngày sau khi máy chủ xác thực phiên và đọc quyền hiện tại. Quyền này không mở quyền quản lý tin tức cho thành viên.

Ngày gốc vẫn được lưu và dùng sắp xếp, quản trị. Phản hồi no-store. Danh sách xóa ngày khi kiểm tra lại phiên, bỏ phản hồi cũ khi quyền thay đổi; trang chi tiết xóa ngày trước khi rời và tải lại khi khôi phục từ bộ nhớ trình duyệt. Không sửa ngày được tác giả viết trong nội dung bài.

Kiểm tra: tests/article-date-access.mjs, tests/news.mjs, tests/mbkd-experience.mjs, tests/news-ui.mjs. Không migration, không bài test trên production.

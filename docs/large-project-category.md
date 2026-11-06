# Các Dự Án Lớn

Danh mục dùng chung cho Cho Thuê và Mua/Bán: bộ lọc, danh sách danh mục, khách hàng, thư mục quản lý và form đăng/sửa tin admin, thành viên. Tin hai giao dịch vẫn dùng một hồ sơ chuẩn.

Mã tin tự động: DA - 0001. Telegram dùng danh mục rõ ràng hoặc #DA / #DAL; không tự phân loại căn hộ chỉ vì nội dung ghi gần dự án lớn. Không cần bot mới, bảng dữ liệu hoặc migration.

Cấu hình danh mục đã lưu được bổ sung lựa chọn mới khi mở trình chỉnh sửa; giới hạn lưu theo schema để không cắt mất danh mục. Ảnh minh họa sử dụng dự phòng BĐS chung nếu chưa có ảnh riêng.

Kiểm tra: tests/large-project-category.mjs, tests/site-layout.mjs, tests/admin-post-transactions-ui.mjs, tests/sale-ui.mjs. tests/listing-content.mjs có lỗi tiêu đề/shareText tồn tại trên base f1e61c4, được tái hiện độc lập.

# Chỉnh sửa website Cho thuê và Mua/Bán

Trong `/admin`, mở một trong hai nhóm:

- **Chỉnh sửa website Cho thuê: đầu trang, menu, danh mục, bố cục & cuối trang**.
- **Chỉnh sửa website Mua/Bán: đầu trang, menu, danh mục, bố cục & cuối trang** (cũng có nút **Chỉnh sửa Mua/Bán**).

Mỗi nhóm có bộ chỉnh sửa đầy đủ: chữ và tiêu đề, nút tìm kiếm, banner qua tải ảnh hoặc đường dẫn, menu, danh mục, màu sắc, thứ tự/ẩn hiện các mục, mục nội dung mới, FAQ, liên hệ, mạng xã hội, liên kết và logo cuối trang. Nhãn danh mục chỉ thay đổi cách hiển thị, không đổi mã phân loại tin.

**Xem trước toàn trang** mở đúng tab đang chỉnh. Bản nháp chưa công khai cho đến khi **Lưu thay đổi**. Mở cả hai nhóm vẫn giữ riêng từng bản nháp. Mỗi tab có phiên bản lưu, lịch sử hoàn tác, khôi phục mặc định, bản sao lưu JSON và logo cuối trang riêng. Bản sao lưu có trường `transaction`; tệp cũ không có trường này được coi là của Cho thuê. Nạp nhầm tab sẽ bị từ chối.

Mua/Bán mặc định sử dụng banner `/sale-banner.webp` và nội dung mua bán hiện có. Không cần khởi tạo dữ liệu thủ công, thêm khóa API hoặc chạy migration. Cấu hình dùng cùng cơ chế lưu `notification_log` đã có, với hai ID riêng; quyền quản trị và kiểm tra phiên bản khi lưu được giữ nguyên. Endpoint public trả cả hai cấu hình để chuyển tab mà không tải lại trang. Nội dung liên hệ/nhãn form theo giao dịch không thay đổi loại dữ liệu tin hoặc cách tính giá.

Kiểm tra: `node tests/site-content.mjs`, `node tests/site-layout.mjs`, `node tests/site-content-ui.mjs`, `node tests/sale-site-content-ui.mjs`, `node tests/sale-ui.mjs`.

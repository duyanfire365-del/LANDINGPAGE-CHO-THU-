# Quản lý tin Cho thuê và Mua/Bán

Vào **Admin → Tin trên website → Quản lý tin đăng**. Hai tab **CHO THUÊ** và **MUA/BÁN** có số lượng, thư mục danh mục, tìm kiếm thông minh, bộ lọc khu vực/giá/trạng thái/trạng thái đăng và phân trang riêng. Xóa bộ lọc chỉ tác động tab đang thao tác, không chuyển sang loại giao dịch khác.

Mỗi tab có mục **Đăng tin / Nhập tài liệu** dùng đầy đủ công cụ nhập gốc, tài liệu, ảnh/video, nguồn riêng và đăng tin hiện có. Form mặc định theo tab; Mua/Bán dùng tổng giá bán, Cho thuê dùng giá tháng. Bản nháp và ảnh đã chọn của hai form được giữ riêng khi chuyển tab. Form chung cũ trong Nhập tài liệu / Đăng tin vẫn hoạt động.

Cả hai danh sách dùng cùng chức năng sửa nội dung/ảnh, quản lý nguồn/map, duyệt, đăng lại/gỡ, xóa vào lưu trữ và chia sẻ. Tin có cả giá thuê và giá bán hiển thị ở cả hai tab với tiêu đề, mô tả và giá phù hợp; khi sửa vẫn mở hồ sơ gốc chứa hai giá. Không nhân đôi tin, slug, mã, ảnh hoặc thông tin nguồn. Sửa/gỡ/xóa hồ sơ chung tác động cả hai cách hiển thị; khôi phục vẫn theo quy trình duyệt bài đã xóa hiện có.

Các bot Telegram hiện có tiếp tục nhập/cập nhật cùng hồ sơ và cùng cài đặt. Nút **Tải lại tin từ website / Telegram** làm mới cả hai danh sách và số lượng; quay lại cửa sổ admin cũng tải lại khi đang xem Quản lý tin đăng. Không cần tạo bot, token hoặc môi trường mới. Việc kết nối bot bổ sung về sau vẫn dùng công cụ kết nối hiện có.

Tab được giữ qua URL `transaction=sale`; có thể dùng phím trái/phải, Home/End. Đăng xuất xóa dữ liệu và bản nháp của cả hai tab khỏi giao diện. Mã phân loại gốc (ví dụ Đất cho thuê) được giữ để tương thích dữ liệu; nhãn hiển thị trong Mua/Bán là Đất.

Kiểm tra: `tests/admin-post-transactions-ui.mjs`, `tests/admin-updates-ui.mjs`, `tests/admin-source-search-ui.mjs`, `tests/dual-api.mjs`, `tests/dual-transaction.mjs`, `tests/transaction-copy.mjs`.

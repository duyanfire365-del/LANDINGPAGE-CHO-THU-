# Quyền xem số lượng tin BĐS

Trang công khai Cho thuê và Mua/bán mặc định không hiện số kết quả và số tin còn lại trên nút Xem thêm. Chỉ phiên admin do máy chủ xác thực bật các số này. Không dùng localStorage hoặc query để tự cấp quyền. Khởi tạo HTML trống/hidden; khi focus, khôi phục trang hoặc hết phiên, số được xóa trước khi xác thực lại. Phản hồi cũ bị bỏ qua khi phiên đã thay đổi.

Admin → Quản lý → Thành viên → Thống kê tin của thành viên: tích/bỏ tích **Cho xem số tin của chính mình**, rồi **Lưu quyền thống kê**. Mặc định tắt cho tất cả tài khoản hiện có và mới. Chỉ admin được đổi quyền; chỉ Sale/CTV có quyền gửi tin mới được cấp. Thu hồi quyền gửi tin làm quyền thống kê không còn hiệu lực.

Thành viên được cấp thấy số tin của mình đang công khai trong trang tài khoản, tách Cho thuê và Mua/bán; tin both tính ở mỗi tab, tổng published không đếm trùng. Tính đúng theo author_id của tài khoản máy chủ đã xác thực, bỏ qua mọi author_id từ URL. Tin chờ duyệt, bị từ chối, lưu trữ không được tính. Hỗ trợ cả dữ liệu transactionType và cờ sale cũ. Tổng lấy bằng HEAD+Prefer count=exact, không suy ra từ danh sách tối đa 100 tin của thành viên hay giới hạn 1000 dòng của DB. Nếu không xác nhận được quyền/tổng thì ẩn thay vì hiện số ước tính. Số tin công khai vẫn có thể suy ra từ danh sách tin đã công bố; đây là điều chỉnh hiển thị/thống kê theo quyền, không phải cơ chế chống thu thập tin công khai.

API: GET /api/catalog?view=listing-count-access chỉ cho biết có được hiện tổng không. GET /api/workspace?view=own-listing-counts trả visible=false hoặc tổng của tài khoản đăng nhập; không trả thống kê người khác. POST /api/workspace action listing-count-permission nằm sau requireAdmin và kiểm tra origin. Phản hồi no-store. Không thay đổi quyền quản lý/sửa/xóa tin.

Migration 20261106_member_post_count_permission.sql bổ sung một boolean can_view_own_post_counts vào profiles, mặc định false. Không sửa bài đăng hoặc quyền đăng hiện tại.

Kiểm tra: tests/listing-counts.mjs (guest/admin/member/forged/revoked, cấp-thu hồi, vượt 1000 tin, both và cờ cũ, không suy đoán khi thiếu Content-Range), tests/sale-ui.mjs (ẩn/hiện và thu hồi tổng, hai tab), tests/legacy-location-ui.mjs (công tắc admin, thống kê riêng và thu hồi, form/địa điểm), tests/member-auth.mjs, tests/news.mjs.

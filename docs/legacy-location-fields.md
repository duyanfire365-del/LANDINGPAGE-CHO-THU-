# Đường/phố và phường/xã theo địa giới cũ

Trang chủ Cho thuê và Mua/Bán có hai ô mới: **Đường / Phố / Xóm / Thôn** và **Phường / Xã / Thị trấn cũ**. Chọn quận/huyện/thị xã cũ ở ô Khu vực hiện có; thành phố của hệ thống hiện là Hà Nội. Bộ lọc kết hợp với mã/từ khóa, danh mục, giá và giao dịch, hỗ trợ gõ không dấu. Không tự đổi tên địa danh cũ sang địa giới mới.

Ô nhập có gợi ý lấy từ địa chỉ công khai trong các tin hiện có; có thể gõ tên cũ chưa có gợi ý. Đây không phải danh bạ địa giới hành chính chính thức đầy đủ. Chỉ tối đa 300 gợi ý mỗi ô được tạo trong trình duyệt. Không tải thêm bản đồ hoặc danh mục địa danh lớn.

Form đăng tin chung, form của hai tab admin và form thành viên có tên đường và phường/xã riêng. Admin sửa được các trường này và khu vực cũ trong Sửa nội dung & ảnh. API lưu `street`, `ward` trong JSON công khai của tin và dựng lại địa chỉ; mã tin, slug, giá thuê/giá bán và nguồn riêng vẫn dùng cơ chế cũ. Các trường không chứa số nhà/ngõ/ngách, điện thoại hay URL; địa chỉ đầy đủ vẫn nhập trong phần riêng tư. Không thay đổi quyền sửa tin của thành viên.

Admin có bộ lọc địa điểm trong các thư viện nguồn/tin của cả hai tab; thành viên có bộ lọc địa điểm cho tin của mình. Các trường được xóa khỏi giao diện khi đăng xuất. Tin cũ và tin nhập Telegram được đối chiếu từ địa chỉ công khai; nếu có trường cũ không còn khớp địa chỉ đã cập nhật, bộ đọc ưu tiên địa chỉ hiện tại. Không cần sửa dữ liệu cũ hàng loạt hoặc đăng lại. Tên phường chưa thể tách rõ vẫn có thể lọc theo nội dung địa chỉ công khai.

Bố cục trang chủ dùng hai hàng trên máy tính, hai cột trên điện thoại, ô cao tối thiểu 44px và khoảng cách gọn hơn. Hai trường chữ chỉ làm tăng dung lượng rất nhỏ so với ảnh/video; không thêm tệp ảnh hay API function, không cần migration/bảng dữ liệu mới.

Kiểm tra: `tests/legacy-locations.mjs`, `tests/legacy-location-ui.mjs`, `tests/sale-ui.mjs`, `tests/admin-post-transactions-ui.mjs`, `tests/admin-updates-ui.mjs`, `tests/dual-api.mjs`.

# Đường/phố và phường/xã theo địa giới cũ

Trang chủ Cho thuê và Mua/Bán có hai ô mới: **Đường / Phố / Xóm / Thôn** và **Phường / Xã / Thị trấn cũ**. Chọn quận/huyện/thị xã cũ ở ô Khu vực hiện có; thành phố của hệ thống hiện là Hà Nội. Bộ lọc kết hợp với mã/từ khóa, danh mục, giá và giao dịch, hỗ trợ gõ không dấu. Không tự đổi tên địa danh cũ sang địa giới mới.

Ô Đường/Phố gợi ý từ địa chỉ công khai trong tin hiện có (tối đa 300). Ô Phường/Xã có nút mũi tên mở danh sách riêng, hỗ trợ bấm chọn, phím lên/xuống, Enter, Escape và gõ không dấu. Danh sách kết hợp dữ liệu tin với danh mục tham chiếu địa danh cũ của Hà Nội, lọc theo khu vực đang chọn. Có thể tự nhập tên chưa có trong danh mục. Không tải bản đồ hoặc dịch vụ bên ngoài khi tìm kiếm.

Form đăng tin chung, form của hai tab admin và form thành viên có tên đường và phường/xã riêng. Admin sửa được các trường này và khu vực cũ trong Sửa nội dung & ảnh. API lưu `street`, `ward` trong JSON công khai của tin và dựng lại địa chỉ; mã tin, slug, giá thuê/giá bán và nguồn riêng vẫn dùng cơ chế cũ. Các trường không chứa số nhà/ngõ/ngách, điện thoại hay URL; địa chỉ đầy đủ vẫn nhập trong phần riêng tư. Không thay đổi quyền sửa tin của thành viên.

Admin có bộ lọc địa điểm trong các thư viện nguồn/tin của cả hai tab; thành viên có bộ lọc địa điểm cho tin của mình. Các trường được xóa khỏi giao diện khi đăng xuất. Tin cũ và tin nhập Telegram được đối chiếu từ địa chỉ công khai; nếu có trường cũ không còn khớp địa chỉ đã cập nhật, bộ đọc ưu tiên địa chỉ hiện tại. Không cần sửa dữ liệu cũ hàng loạt hoặc đăng lại. Tên phường chưa thể tách rõ vẫn có thể lọc theo nội dung địa chỉ công khai.

Bố cục trang chủ dùng hai hàng trên máy tính, hai cột trên điện thoại, ô cao tối thiểu 44px và khoảng cách gọn hơn. Hai trường chữ chỉ làm tăng dung lượng rất nhỏ so với ảnh/video; không thêm tệp ảnh hay API function, không cần migration/bảng dữ liệu mới.

Kiểm tra: `tests/legacy-locations.mjs`, `tests/legacy-location-ui.mjs`, `tests/sale-ui.mjs`, `tests/admin-post-transactions-ui.mjs`, `tests/admin-updates-ui.mjs`, `tests/dual-api.mjs`.

Danh mục `public/hanoi-legacy-wards.json` gồm 30 quận/huyện/thị xã và 579 phường/xã/thị trấn, khoảng 12 KB, được tải một lần khi mở gợi ý. Nguồn: [madnh/hanhchinhvn](https://github.com/madnh/hanhchinhvn), snapshot commit `7ea41908d1889aa83356ebf9f2f3e23d5c3a798e` (2023), trích riêng dữ liệu Hà Nội từ `dist/tree.json`. Kho nguồn ghi dữ liệu được xuất từ Tổng cục Thống kê. Đây là tham chiếu trước sắp xếp năm 2025, không tự tuyên bố bao phủ mọi thay đổi hành chính sau snapshot. Chỉ sử dụng các tên địa danh và quan hệ quận/huyện để gợi ý. Form đăng/sửa tin admin và thành viên dùng cùng nút chọn phường/xã.

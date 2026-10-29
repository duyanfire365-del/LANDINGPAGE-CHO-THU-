# Tự thay logo website

Sau khi bản cập nhật được triển khai: vào `/admin` → đăng nhập → mở **Logo website — tải lên / thay đổi thủ công** ngay đầu vùng quản trị, phía trên các tab công cụ.

1. Chọn logo PNG, JPEG hoặc WebP, tối đa 2 MB. Chọn ảnh chỉ xem trước, chưa đổi website.
2. Nhập tên/mô tả logo để người dùng trình đọc màn hình nhận biết.
3. Bấm **Lưu logo website**. Logo ở đầu trang quản trị đổi ngay; trang chủ, trang thành viên và các trang tin nhận logo khi tải lại.
4. Muốn quay về giao diện cũ, bấm **Khôi phục logo mặc định**. Nút Tải lại lấy cấu hình hiện tại khi có người khác vừa thay logo.

Áp dụng đúng phần đầu trang đã chỉ trong ảnh. Không đổi tên miền, tên website, nội dung tin, favicon, QR, ảnh chia sẻ hoặc logo đóng dấu trên ảnh. Giữ liên kết về trang chủ và tất cả chức năng cũ.

Ảnh giữ nguyên tỷ lệ, tự thu nhỏ trên máy tính/điện thoại và giữ nền trong suốt nếu có. Dùng ảnh tĩnh từ 24×24 px, không quá 12 triệu điểm ảnh; không nhận SVG, ảnh động, PDF hay tài liệu. Nếu có logo dạng vector, xuất ra PNG/WebP trước. Máy chủ kiểm tra chữ ký file/nội dung ảnh, tự xoay đúng hướng và chuyển thành WebP tối đa 900×200 px, dưới 250 KB; không lưu metadata EXIF gốc.

Chỉ admin có quyền lưu/khôi phục. Cấu hình và ảnh tối ưu được giữ trong bản ghi riêng `website-logo:v1` của kho server-only đang có; không thay bảng/quyền. Endpoint công khai chỉ trả ảnh logo đã tối ưu và metadata hiển thị, không truy cập tài liệu/ảnh nguồn riêng. Có kiểm tra phiên bản chống ghi đè khi hai người cùng thay, và ETag/revision cho bộ nhớ đệm. Nếu cấu hình hoặc ảnh chưa tải được, giao diện giữ nguyên thương hiệu mặc định thay vì để trống.

Không cần đăng ký dịch vụ upload mới hoặc mua API. Chưa có file logo thật được cung cấp hoặc tải lên production trong quá trình phát triển.

Kiểm thử: `node tests/website-logo.mjs`; `node tests/website-logo-ui.mjs`. Kiểm tra ảnh thật, resize/alpha, chặn SVG/ảnh quá lớn, admin/CSRF/CAS, endpoint công khai và cache, xem trước không lưu, thay logo giữ link trang chủ, tải lại, di động, khôi phục và đăng xuất. Toàn bộ dữ liệu/ảnh minh họa dùng trong kiểm thử nằm trong kho giả, không thay logo thật.

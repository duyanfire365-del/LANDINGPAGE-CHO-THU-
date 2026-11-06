# Admin quyết định nội dung bài chỉnh sửa

Lỗi cũ: edit-post dùng splitPrivateNotes + splitPriceNotes + polishListingCopy + safePublicText như luồng nhập tin tự động. Chỉ cần nội dung có địa chỉ/số nhà, hashtag, liên kết, điều kiện thanh toán hoặc mô tả quán/giá sang nhượng là có thể bị chặn hoặc bị cắt. Giới hạn mô tả cũ 3.000 ký tự cũng làm bản sửa dài bị thiếu.

Sau sửa: API edit-post (vẫn sau requireAdmin, same-origin) lưu mô tả admin nhập dạng văn bản tối đa 16.000 ký tự, cho phép để trống. Không tự tách nội dung công khai sang nội bộ hoặc viết lại câu chữ. Cho phép admin quyết định tiêu đề, địa chỉ, mặt tiền và nội dung có hashtag/liên kết. Số/giá, loại giao dịch, mã không trùng, quyền media và chống ghi đè phiên bản đồng thời vẫn kiểm tra để lưu đúng hồ sơ; lỗi trả đúng trường thay vì thông báo riêng tư chung chung.

Bản admin sửa được đánh dấu adminAuthoredCopy tại máy chủ. Các bước chuẩn hóa danh mục/mã, đọc lại mô tả cũ/viết tắt, frontage, projection hai giao dịch, chia sẻ và backfill không tự xóa nội dung đã duyệt. Marker không được lấy từ body của luồng thành viên/nguồn tự động. Những luồng đó giữ quy tắc hiện tại.

Giá chuyển nhượng có checkbox Hiển thị giá chuyển nhượng công khai. Mặc định dựa trên giá đang công khai, không dựa trên giá kín: mở tin cũ và lưu không tự lộ giá nội bộ. Giá kín và các trường nguồn/địa chỉ/hashtag nội bộ đã lưu được giữ khi không gửi thay đổi. Admin có thể chủ động viết giá trong mô tả bất kể checkbox giá có bật hay không.

Nội dung vẫn là văn bản, được escape ở giao diện và metadata, không chạy HTML/JavaScript. Không đổi quyền tài khoản, không tự sửa hàng loạt bài cũ và không đổi sourceText gốc.

Kiểm tra: admin-manual-edit.mjs dùng handler thật qua fixture: rent/sale/both, mô tả >3.000 ký tự, địa chỉ/URL/hashtag/TT3C1/giá nhượng, frontage dưới 3,5m, đọc catalog/SSR/chia sẻ, giữ riêng tư, không tự cấp quyền, numeric/CAS/origin. edit-save-feedback-ui.mjs kiểm tra form dài/checkbox/payload, pending lock, retry và literal HTML không chạy; admin-post-transactions-ui.mjs và dual-api.mjs kiểm tra các tab/giá. listing-privacy, listing-privacy-sync, large-project-category và listing-counts giữ hành vi các luồng không phải bản sửa admin.

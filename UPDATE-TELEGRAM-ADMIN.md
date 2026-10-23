# Cập nhật Telegram và quản trị

Bản cập nhật Telegram, mã tin và thành viên quản trị.

## Cài đặt một lần
1. Dùng Supabase Storage bucket rental-private đã có. Không cần chạy thêm SQL. Mã thủ công được giữ chỗ bằng thao tác tạo tệp duy nhất, chỉ máy chủ truy cập.
2. Cập nhật toàn bộ các tệp trong gói cùng một commit trên đúng kho mã nguồn. Gói là bản cập nhật, không thay toàn bộ dự án.
3. Chờ Vercel Production Ready, tải lại trang quản trị và trang thành viên.

## Sử dụng
- Telegram: #KX kho xưởng, #MB mặt bằng kinh doanh, #NC nhà nguyên căn, #DAT hoặc #DT đất cho thuê; #VP, #CHCC, #CHDV, #PT, #BT, #LK, #KO, #KIOT. Không phân biệt hoa/thường. Nhiều hashtag: nhóm đầu là nhóm chính, các nhóm còn lại để lọc. Hashtag lạ giữ riêng, không đoán.
- Cập nhật phân loại tin cũ: trả lời tin gốc hoặc thông báo có mã bằng /capnhat VP - 0002 #KX. Không tạo tin mới; giữ URL và ảnh. Nếu webhook không nhận đủ ngữ cảnh, gửi mã tin rõ ràng.
- Số ngoài hotline 0906215365 (kể cả khi từng được đánh dấu cho phép công khai trong nguồn): lưu sourcePhones riêng và đưa các số chưa gắn nhãn vào nguồn đối tác riêng (tối đa 3 ô); toàn bộ vẫn lưu trong bài gốc riêng. Không phân biệt được chủ hay đối tác thì không tự khẳng định. Không đọc/che số điện thoại nằm trong ảnh; kiểm tra ảnh trước khi đăng.
- Quản trị → Sửa nội dung & ảnh → Mã tin: nhập đúng tiền tố danh mục và số, ví dụ KX - 0077. Mã cũ giữ để tra cứu, không đổi URL. Đất dùng tiền tố DT hiện có; hashtag nhận cả DAT. Mã đã có hoặc đã lưu làm mã cũ của tin khác bị từ chối. Không cần chạy SQL mới.
- Quản trị → Thành viên → Tạo thành viên không cần email: biệt danh 3–40 ký tự không dấu, họ tên, mật khẩu 6–128 ký tự. Thành viên đăng nhập tại /thanh-vien bằng biệt danh và mật khẩu. Không gửi email/OTP. Hệ thống dùng địa chỉ nội bộ không nhận thư để tương thích Supabase Auth. Biệt danh không phân biệt hoa/thường. Quyền đăng tin phải cấp riêng, không tự cấp quản trị. Chính sách mật khẩu Supabase có thể yêu cầu mạnh hơn 6 ký tự.

## Kiểm tra trước sử dụng
Chạy npm ci và npm run check, node tests/intake-admin-updates.mjs, node tests/member-auth.mjs, node tests/telegram-title.mjs, node tests/dual-category.mjs, node tests/source-rules.mjs, node tests/listing-content.mjs.
Cần kiểm thử một tài khoản giả trên Supabase và luồng Telegram thực tế sau triển khai. Kiểm tra trạng thái triển khai và thử bằng một tin/tài khoản mẫu sau khi Production Ready.

# Cập nhật Telegram và quản trị

Bản cập nhật Telegram, mã tin và thành viên quản trị.

## Cài đặt một lần
1. Mã thủ công lưu trực tiếp trên tin trong Supabase Database, không cần Storage hay SQL mới.
2. Cập nhật toàn bộ các tệp trong gói cùng một commit trên đúng kho mã nguồn. Gói là bản cập nhật, không thay toàn bộ dự án.
3. Chờ Vercel Production Ready, tải lại trang quản trị và trang thành viên.

## Sử dụng
- Telegram: #KX kho xưởng, #MB mặt bằng kinh doanh, #NC nhà nguyên căn, #DAT hoặc #DT đất cho thuê; #VP, #CHCC, #CHDV, #PT, #BT, #LK, #KO, #KIOT. Không phân biệt hoa/thường. Nhiều hashtag: nhóm đầu là nhóm chính, các nhóm còn lại để lọc. Hashtag lạ giữ riêng, không đoán.
- Cập nhật phân loại tin cũ: trả lời tin gốc hoặc thông báo có mã bằng /capnhat VP - 0002 #KX. Không tạo tin mới; giữ URL và ảnh. Nếu webhook không nhận đủ ngữ cảnh, gửi mã tin rõ ràng.
- Số ngoài hotline 0906215365 (kể cả khi từng được đánh dấu cho phép công khai trong nguồn): lưu sourcePhones riêng và đưa các số chưa gắn nhãn vào nguồn đối tác riêng (tối đa 3 ô); toàn bộ vẫn lưu trong bài gốc riêng. Không phân biệt được chủ hay đối tác thì không tự khẳng định. Không đọc/che số điện thoại nằm trong ảnh; kiểm tra ảnh trước khi đăng.
- Quản trị → Sửa nội dung & ảnh → Mã tin: nhập đúng tiền tố danh mục và số, ví dụ KX - 0077. Mã cũ giữ để tra cứu, không đổi URL. Đất dùng tiền tố DT hiện có; hashtag nhận cả DAT. Mã đang dùng hoặc lưu làm mã cũ của tin còn hoạt động bị từ chối. Mã của tin đã xóa được dùng lại; nếu khôi phục tin cũ đã mất mã, hệ thống cấp mã khác để tránh trùng. Không cần chạy SQL mới.
- Quản trị → Thành viên → Tạo thành viên không cần email: biệt danh 3–40 ký tự không dấu, họ tên, mật khẩu 6–128 ký tự. Thành viên đăng nhập tại /thanh-vien bằng biệt danh và mật khẩu. Không gửi email/OTP. Hệ thống dùng địa chỉ nội bộ không nhận thư để tương thích Supabase Auth. Biệt danh không phân biệt hoa/thường. Quyền đăng tin phải cấp riêng, không tự cấp quản trị. Chính sách mật khẩu Supabase có thể yêu cầu mạnh hơn 6 ký tự.

## Kiểm tra trước sử dụng
Chạy npm ci và npm run check, node tests/intake-admin-updates.mjs, node tests/member-auth.mjs, node tests/telegram-title.mjs, node tests/dual-category.mjs, node tests/source-rules.mjs, node tests/listing-content.mjs.
Cần kiểm thử một tài khoản giả trên Supabase và luồng Telegram thực tế sau triển khai. Kiểm tra trạng thái triển khai và thử bằng một tin/tài khoản mẫu sau khi Production Ready.

## Sửa tin và trạng thái bằng hashtag
- Trả lời bài gốc hoặc thông báo Telegram bằng `#suatin` kèm nội dung sửa; hoặc ghi mã rõ ràng: `#suatin KX - 0001` rồi xuống dòng ghi `Giá thuê: 15 triệu/tháng`.
- Gửi lại nguyên bài đã chỉnh kèm `#suatin`: hệ thống tìm theo địa chỉ riêng, bài nguồn hoặc vị trí + diện tích. Có nhiều tin khớp hoặc không đủ dữ liệu thì yêu cầu mã/đường dẫn, không tự đoán và không tạo tin mới.
- Muốn thay cả mô tả: gửi bài đầy đủ nhiều dòng kèm `#suatin`; hoặc ghi `Mô tả: ...` để thay nội dung ngắn.
- `#tamdung` tạm dừng, `#dachothue` đã cho thuê, `#conhang` còn hàng, `#choxacnhan` chờ xác nhận, `#hot` bật HOT, `#bohot` tắt HOT. Không phân biệt chữ hoa/thường. HOT chỉ hiện nổi bật khi tin còn hàng theo quy tắc hiện có.
- Có thể dùng `#conhang #hot KX - 0001`. Với tin cũ nên kèm mã hoặc trả lời bài gốc. Lệnh trạng thái ngắn không kèm mã/ngữ cảnh cập nhật tin đăng/cập nhật thành công gần nhất trong cuộc trò chuyện riêng của chủ bot.
- Lệnh sửa không dùng hạn mức tạo bài/ảnh AI. Vẫn cần Telegram webhook và xử lý nền Vercel hoạt động; không cam kết cập nhật tức thời nếu dịch vụ ngoài gián đoạn.
- Kiểm tra: `node tests/telegram-edit-commands.mjs`, `node tests/telegram-inbox.mjs`, `node tests/source-automation.mjs`, `node tests/intake-admin-updates.mjs`, `npm run check`.

## Sửa nội dung và chuyển dữ liệu kín vào đúng mục
- Dùng `Sửa tin KX - 0001` hoặc `#suatin KX - 0001`, sau đó xuống dòng ghi các trường cần sửa.
- `Mô tả: ...` hoặc `Nội dung: ...` cập nhật phần công khai. `Giá thuê: ...`, `Diện tích: ...`, `Địa chỉ: ...` cập nhật các thông tin tương ứng.
- `Chủ nhà anh Nam: 0987654321` và `Đối tác chị Lan: 0912345678` được đọc vào đúng nhóm điện thoại kín. Nhập `Chủ nhà 1: ...` để thay đúng ô 1; số không chỉ định ô được bổ sung vào chỗ còn trống. Giao diện hiện có ba ô mỗi nhóm; bản gốc và ghi chú kín giữ nguyên thông tin còn lại.
- `Hoa hồng: ...` vào ô hoa hồng; `Ghi chú kín: ...`, `Thông tin nội bộ: ...` và các dòng tiếp theo vào ô ghi chú/dữ liệu kín. Nên đặt phần kín ở cuối bài; dùng dòng `Nội dung công khai:` để kết thúc phần kín nếu cần viết tiếp nội dung công khai.
- Xem trong quản trị → tin tương ứng → Nguồn / Map riêng → Hoa hồng và Ghi chú / dữ liệu kín. Hai mục này chỉ quản trị và chủ bài xem được; không có tùy chọn công khai.

## Banner tự chọn trên website và biên tập nội dung
- Bài mới không có ảnh dùng banner theo danh mục: kho xưởng, mặt bằng, nhà nguyên căn, đất, văn phòng… Website có sẵn 11 mẫu PNG; không gọi dịch vụ tạo ảnh AI từ Telegram, không cần khóa hay phí API cho ảnh.
- Bài có ảnh gửi kèm giữ ảnh đó. Ảnh AI đã tạo từ trước cũng được giữ; chức năng tạo ảnh AI thủ công trong công cụ quản trị không bị thay đổi.
- Tin cũ dùng banner chung được hiển thị bằng mẫu theo danh mục. Khi đổi danh mục, banner đổi theo. Banner mang nhãn minh họa và hotline công khai, không chứa địa chỉ riêng hoặc số nguồn.
- /status cho biết chế độ banner danh mục. Các biến TELEGRAM_AI_IMAGES cũ không còn bật tạo ảnh trong luồng Telegram.
- Biên tập nội dung vẫn hoạt động cho bài mới và #suatin: bổ sung bố cục/câu liên hệ cho bài ngắn, bỏ lặp và tinh gọn bài dài, không tự thêm dữ kiện. Bài gốc giữ riêng.

## Hỏi lại khi gửi bài trùng
- Bài có thể trùng được giữ ở trạng thái chờ và bot gửi mã/tiêu đề tin cũ, giá cũ và giá vừa gửi để đối chiếu.
- Trả lời câu hỏi của bot bằng `1`: đăng thêm MỘT tin mới, giữ nguyên tin cũ và dữ liệu nguồn riêng của từng bài. `0`: bỏ qua, không đăng thêm.
- Nếu chỉ có một bài chờ có thể gửi riêng `1` hoặc `0`. Nếu có nhiều bài chờ, cần dùng Reply vào đúng câu hỏi. Yêu cầu chờ lưu trong Supabase, không mất khi hàm Vercel kết thúc.
- Mỗi tin nhắn Telegram mới được xem là một lần gửi có chủ ý; nội dung giống lần trước vẫn được đưa qua bước nhận diện trùng để hỏi lại. Telegram giao lại cùng tin nhắn không tạo thêm yêu cầu hoặc bài đăng.
- Trả lời lặp hoặc đồng thời không tạo thêm bài. #suatin và các hashtag đổi trạng thái vẫn cập nhật bài hiện có, không hỏi đăng thêm.

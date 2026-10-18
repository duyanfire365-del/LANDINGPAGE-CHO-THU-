# Kích hoạt thành viên, đăng tin, hồ sơ và Telegram

Mã nguồn đã có cổng thành viên, cấp quyền Sale/CTV, hàng chờ duyệt, nhập tài liệu, tải ảnh/video và xuất Excel/Word/PDF. Các dịch vụ thật cần được kết nối trong tài khoản của chủ website. Không gửi khóa hoặc mật khẩu vào chat hay GitHub.

## 1. Supabase: lưu tài khoản, nhu cầu và tệp

1. Đăng nhập https://supabase.com/dashboard và tạo **New project**. Chọn khu vực gần Việt Nam và lưu mật khẩu database riêng.
2. Mở **SQL Editor → New query**, dán toàn bộ `database/setup.sql` trong repository rồi **Run**. Script tạo các bảng và bucket riêng tư `rental-private`; người chưa đăng nhập không đọc trực tiếp dữ liệu.
3. Trong **Project Settings → API / API Keys**, lấy Project URL, khóa `anon` và khóa `service_role` (legacy keys nếu giao diện đang hiển thị khóa mới).
4. Trong Vercel → webchothue → **Settings → Environment Variables**, thêm cho **Production**:

| Tên biến | Giá trị |
|---|---|
| `SUPABASE_URL` | Project URL, bắt đầu bằng `https://` |
| `SUPABASE_ANON_KEY` | Khóa `anon` của dự án |
| `SUPABASE_SERVICE_ROLE_KEY` | Khóa `service_role`, đánh dấu Sensitive |
| `ADMIN_SECRET` | Giữ nguyên khóa quản trị đã bàn giao, dùng để giải mã 22 tin cũ |

5. Supabase → **Authentication → URL Configuration**: Site URL là `https://nguonchothue.vn`; thêm URL này vào danh sách redirect được phép. Khi đổi tên miền, cập nhật cả hai nơi.
6. Giữ **Confirm email** bật. Cấu hình **Custom SMTP** để gửi email xác nhận cho khách thật; mail thử mặc định của Supabase có giới hạn người nhận/tần suất. Người đăng ký xác nhận email trước khi đăng nhập.
7. Vercel → **Deployments → bản mới nhất → Redeploy**. Không bỏ qua bước này sau khi thêm biến.

Trang khách: `/thanh-vien`. Trang quản lý: `/admin`.

## 2. Quyền và duyệt tin

- Khách hàng: đăng ký nhu cầu cần thuê/ký gửi; không có quyền đăng bài.
- Sale/CTV: tài khoản mới chưa được gửi tin. Quản trị mở **Thành viên → Cấp quyền gửi tin**; có thể thu hồi bất kỳ lúc nào.
- Tất cả tin, kể cả do quản trị chuẩn bị, vào trạng thái **Chờ duyệt**. Quản trị kiểm tra phần công khai, địa chỉ riêng tư, ảnh/video rồi **Duyệt đăng**. Có thể gỡ tin đã đăng.
- Cấp quyền gửi tin không cấp quyền xem nguồn riêng của người khác, hồ sơ khách, danh sách thành viên hoặc xuất dữ liệu riêng.
- Khách chỉ thấy tên đường/khu vực. Địa chỉ chính xác và hashtag của tin mới được lưu trong `private_data`, không trả trong API danh sách công khai. 22 tin cũ tiếp tục được mã hóa theo khóa quản trị.

## 3. Telegram

1. Trong Telegram, mở **@BotFather → /newbot**, đặt tên bot và nhận token.
2. Mở bot vừa tạo, nhấn **Start**. Nếu muốn nhận vào nhóm, thêm bot vào nhóm và gửi một tin nhắn trong nhóm.
3. Lấy chat ID bằng API `getUpdates` của chính bot trong công cụ riêng của anh; không dán token vào chat này, Git hoặc ảnh chụp màn hình công khai.
4. Thêm `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` vào Vercel Production, rồi Redeploy.

Bot báo khi có thành viên, yêu cầu cần thuê/ký gửi hoặc tin chờ duyệt. Hồ sơ được lưu trước; Telegram lỗi không làm mất đăng ký. Thông báo chưa gửi nằm trong trang quản trị **Xuất dữ liệu → Gửi lại Telegram**. Tin nhắn không gửi địa chỉ BĐS cụ thể; quản trị mở website để xem đầy đủ. Việc gửi lại thủ công có thể trùng thông báo nếu lần trước Telegram đã nhận nhưng phản hồi bị gián đoạn.

## 4. Nhập tài liệu và AI

- Quản trị: **Nhập tài liệu / Đăng tin**. Sale được cấp quyền: phần **Chuẩn bị tin đăng** trong tài khoản.
- Tải `.xlsx`, `.docx`, `.pdf` có lớp văn bản hoặc `.txt`, bấm **Đọc [tên tệp]**. Excel có các cột tiêu chuẩn sẽ tách từng dòng, tối đa 30 bản nháp/lần. Có nút tải mẫu Excel ngay trong quản trị.
- Cột Excel: `Tiêu đề công khai`, `Tên đường công khai`, `Khu vực`, `Danh mục`, `Giá thuê (triệu/tháng)`, `Diện tích`, `Mô tả công khai`, `Địa chỉ riêng tư`, `Hashtag`.
- Khi chưa có AI: trích xuất văn bản, gợi ý khu vực/danh mục/giá/diện tích khi nhận diện được; người đăng hoàn thiện các trường còn thiếu. Không tự nhận là AI và không tự xuất bản.
- AI đọc ảnh, PDF quét hoặc chia nhiều tin từ nội dung tự do cần `OPENAI_API_KEY` hoặc `OPENROUTER_API_KEY`, `AI_PROVIDER` và model hỗ trợ ảnh trong `AI_MODEL`. Không có khóa thì đọc ảnh sẽ báo rõ chưa kết nối. PDF quét cần chuyển trang sang ảnh để dùng luồng đọc ảnh; chưa có OCR PDF quét tự động.
- Chọn **Dùng AI** là đồng ý gửi tài liệu/ảnh đó tới nhà cung cấp đã cấu hình. Nội dung tài liệu là dữ liệu đầu vào, không có quyền thay đổi hệ thống.
- Kết quả AI chỉ là bản nháp; kiểm tra giá thuê khác giá sang nhượng, địa chỉ công khai, danh mục và tình trạng trước khi gửi duyệt. Không tự suy ra dữ liệu thiếu. Chưa phân tích nội dung video bằng AI.
- PDF xử lý tối đa 30 trang đầu và 60.000 ký tự văn bản mỗi lần. Tệp lớn hoặc nhiều tin nên chia nhỏ; tài liệu giải nén trên 40 MB bị từ chối.

## 5. Ảnh, video và tải về

- Ảnh JPG/PNG/WebP, tài liệu tối đa 10 MB mỗi tệp. Video MP4/WebM tối đa 50 MB mỗi tệp; tối đa 12 tệp mỗi lượt chuẩn bị tin.
- Tệp tải trực tiếp vào bucket riêng tư qua liên kết được máy chủ cấp, tránh giới hạn thân request của Vercel. Tệp nguồn không xuất hiện công khai.
- Ảnh/video của tin đã được duyệt có nút tải trên trang chi tiết. Các tin minh họa cũ có nút **Tải ảnh minh họa**.
- Với tin chờ duyệt, chỉ người tải và quản trị mở được tệp. Cần kiểm tra ảnh/video không có số nhà/ngõ/ngách, watermark hoặc hashtag cần giữ riêng trước khi duyệt; hệ thống không tự xóa chữ đã nằm trong điểm ảnh hay lời thoại video.

## 6. Xuất hồ sơ và tin

Sau khi đăng nhập quản trị, mục **Xuất dữ liệu** tải Excel `.xlsx`, Word `.docx`, PDF. PDF có font hỗ trợ tiếng Việt. Xuất tin có 22 tin cũ và tin mới đã được duyệt; hồ sơ thành viên và cần thuê/ký gửi lấy từ database. Mỗi lần xuất dữ liệu động tối đa 1.000 bản ghi, danh sách quản trị hiển thị tối đa 500 bản ghi mới nhất. Tệp xuất chứa thông tin riêng tư; không đưa vào thư mục public.

## 7. Kiểm tra sau khi kích hoạt

1. Dùng email thật đăng ký một khách hàng và một Sale/CTV, xác nhận email rồi đăng nhập.
2. Khách gửi một nhu cầu thuê và một ký gửi; kiểm tra quản trị và Telegram.
3. Cấp quyền Sale, gửi một tin; trình duyệt khách chưa thấy tin khi chưa duyệt. Duyệt rồi kiểm tra danh sách/trang chi tiết và nút tải ảnh/video.
4. Xem bằng cửa sổ ẩn danh: không có số nhà/ngõ/ngách/hashtag trong dữ liệu tin. Không xem được hồ sơ hay xuất tệp quản trị.
5. Tải Excel, Word, PDF để kiểm tra nội dung. Tải mẫu Excel, nhập thử hai dòng vào bản nháp, kiểm tra dữ liệu trước khi gửi.

Kiểm thử trong môi trường phát triển đã dùng dịch vụ giả lập; không thay thế kiểm tra kết nối Supabase, SMTP, Telegram và AI thật sau khi nhập khóa.

## Ghi nhận kiểm thử phụ thuộc

Cài lại thành công bằng `npm ci` theo lockfile. Kiểm tra npm audit không có mức high/critical; còn 5 cảnh báo moderate trong phụ thuộc gián tiếp của ExcelJS/Mammoth. Không dùng `audit fix --force` vì đề xuất hạ phiên bản phá vỡ API. Luồng hiện tại chỉ dùng UUID v4 và API trích văn bản, không gọi CLI argparse. Nên theo dõi bản vá upstream khi bảo trì.

## Bổ sung ký gửi bán / chuyển nhượng

Biểu mẫu chung có bốn nhu cầu: Cần thuê, Ký gửi cho thuê, Ký gửi bán, Chuyển nhượng. Giá bán và chuyển nhượng tính bằng triệu đồng một lần; tiền thuê hiện tại (nếu có) là khoản riêng theo tháng. Hồ sơ chỉ gửi tư vấn/quản trị, không tự xuất bản tin bán vào danh sách BĐS cho thuê.

Dự án Supabase mới dùng bản `database/setup.sql` mới nhất. Nếu đã chạy SQL cũ, chạy thêm `database/migrations/002-sale-transfer.sql` trong SQL Editor trước khi tiếp nhận hai loại hồ sơ mới. Migration thêm cột giá chung, tiền thuê hiện tại và mở rộng các loại nhu cầu; giữ nguyên hồ sơ thuê trước đây.

## Quản lý khách gửi thông tin

Trang `/admin` mở sẵn mục **Khách gửi thông tin**: tra cứu họ tên/điện thoại/khu vực, lọc bốn loại nhu cầu và trạng thái xử lý, xem từng trang 20 hồ sơ, gọi điện/mở Zalo, lưu ghi chú riêng. Có bốn trạng thái: Mới, Đã liên hệ, Đang chăm sóc, Đã hoàn tất. Trạng thái và ghi chú nội bộ đi kèm khi xuất Excel/Word/PDF và không trả cho thành viên/khách. Dùng **Làm mới** để nhận hồ sơ mới gửi.

Dự án Supabase mới chạy `database/setup.sql` hiện tại. Dự án đã thiết lập trước đó cần chạy `database/migrations/003-inquiry-management.sql` để có cột quản lý. Nếu chưa chạy migration 002 cho bán/chuyển nhượng, chạy 002 trước rồi 003. Hồ sơ khách đã gửi thành công được giữ nguyên. Thông tin khách chỉ chuẩn bị trên biểu mẫu nhưng chưa gửi, hoặc tự nhắn qua Zalo, không tự xuất hiện trong quản trị. Chưa kết nối Supabase thì không thể lưu/đọc hồ sơ thật; API và giao diện sẽ báo lỗi kết nối.

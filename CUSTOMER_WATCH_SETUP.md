# Khách theo dõi riêng: thiết lập từng bước

## 1. Bật bảng dữ liệu
1. Mở [007_customer_watch.sql trên GitHub](https://github.com/duyanfire365-del/LANDINGPAGE-CHO-THU-/blob/main/database/007_customer_watch.sql).
2. Sao chép toàn bộ mã trong file.
3. Mở Supabase → đúng dự án website → SQL Editor → New query.
4. Dán mã, bấm Run. `Success. No rows returned` là thành công.
5. Đợi bản Vercel mới Ready rồi tải lại trang quản trị.

Không thay khóa Supabase, ADMIN_SECRET hay mật khẩu hiện có. SQL này thêm bảng riêng và bật RLS; không cấp quyền đọc bảng cho khách/trình duyệt. Website kiểm tra đăng nhập ở máy chủ: admin đọc/sửa mọi hồ sơ, thành viên chỉ đọc/sửa hồ sơ do mình nhập. Hồ sơ bot do admin quản lý. Địa chỉ, số điện thoại, ghi chú khách không đưa vào trang công khai hoặc bài chia sẻ.

## 2. Dùng trên website
- Quản trị → Khách hàng / Công cụ → Khách theo dõi riêng.
- Thành viên đăng nhập → Khách theo dõi riêng trong khu vực tài khoản.
- Mở “Thêm / chỉnh hồ sơ khách”, nhập tên/SĐT, khu vực, ngành nghề, loại BĐS, ngân sách tối đa, diện tích tối thiểu, các yêu cầu, ghi chú, ngày đã liên hệ/dẫn khách, ngày hẹn chăm sóc. Bấm Lưu và tìm nguồn.
- Bấm Gợi ý nguồn phù hợp trên từng hồ sơ để xem kết quả cập nhật.
- Có 3 trạng thái: Khách đang tìm; Đang chăm sóc / Đã dẫn; Đã khớp / Tạm ngừng. Trạng thái cuối dừng thông báo khớp mới.
- Danh sách phân trang 20 khách, tìm theo tên/SĐT. Không đưa tất cả hồ sơ thành một trang quá dài.
- Các trường năm sinh, địa chỉ, ghi chú do người quản lý ghi nhận; không có xác minh danh tính tự động.
- Kết quả đối chiếu theo tiêu chí đã cấu trúc và dữ liệu tin công khai: khu vực, loại hình, ngành nghề được đề cập, ngân sách, diện tích. Yêu cầu riêng (PCCC, pháp lý, mặt tiền, điều kiện kinh doanh…) cần người tư vấn kiểm tra. Không có nguồn khớp thì giữ khách chờ; không tự đưa tin vượt ngân sách hoặc đã cho thuê vào danh sách khớp.

## 3. Tạo bot Telegram KHÁCH HÀNG riêng
1. Mở Telegram → tìm BotFather có dấu xác minh → gửi `/newbot`.
2. Đặt tên, ví dụ `Khách hàng Nguồn BĐS`; đặt username riêng kết thúc bằng `_bot`.
3. Sao chép token BotFather cấp và lưu kín. KHÔNG gửi token vào chat hoặc ảnh chụp.
4. Mở bot mới → Start → gửi `Xin chào`.
5. Trong trình duyệt của anh, mở `https://api.telegram.org/botTOKEN_MOI/getUpdates`. Thay TOKEN_MOI bằng token mới, không có dấu ngoặc.
6. Trong kết quả tìm `message` → `chat` → `id`. Lấy dãy số này, không lấy update_id/message_id. Nếu `result: []`, gửi thêm tin cho đúng bot rồi tải lại.
7. Vercel → webchothue → Settings → Environment Variables → thêm cho Production:
   - TELEGRAM_CUSTOMER_BOT_TOKEN: token bot mới.
   - TELEGRAM_CUSTOMER_OWNER_ID: chat.id cá nhân của anh (dãy số dương).
8. Giữ nguyên biến bot nguồn và bot báo đăng ký; không dùng chung token. Vào Deployments → bản Production mới nhất → Redeploy → chờ Ready.
9. Đăng nhập quản trị → Khách theo dõi riêng → Kết nối bot khách riêng. Website tự gắn webhook và gửi tin thử. Sau khi gắn webhook, getUpdates không còn là cách nhận tin của bot này.
10. Dán hồ sơ khách vào bot. Bot chỉ nhận tin nhắn riêng từ đúng tài khoản có ID đã cấu hình; tin của người khác/nhóm được bỏ qua. Thành viên nhập khách qua website, không được dùng bot quản trị để đọc khách của người khác.

Mẫu tin:
```
Tên: Anh Nam
SĐT: 0912345678
Địa chỉ: Hà Nội
Năm sinh: 1985
Khu vực: Cầu Giấy hoặc Mỹ Đình
Loại BĐS: Văn phòng
Ngành nghề: Văn phòng
Ngân sách tối đa: 30 triệu
Diện tích tối thiểu: 80m²
Nhu cầu: Có chỗ để ô tô, thuê từ tháng tới
Ghi chú: Đã gọi, khách muốn đi xem cuối tuần
```

Nhiều khách: mỗi khách bắt đầu bằng `Tên:`; tốt nhất ngăn bằng dòng `---`. Cùng SĐT và cùng người quản lý: giữ hồ sơ cũ, không ghi đè ghi chú; mở hồ sơ để cập nhật. Một đoạn có nhiều số điện thoại chưa phân biệt được ai là khách sẽ vào mục Cần kiểm tra.

## 4. Tệp và ảnh
- Web: tối đa 3 MB/tệp; bot: tối đa 10 MB/tệp; tối đa 50 khách/lần.
- Đọc DOCX, XLSX, PDF có chữ, TXT/CSV. Excel dùng trang tính đầu tiên. Excel/CSV: dòng đầu là tiêu đề `Tên`, `SĐT`, `Khu vực`, `Loại BĐS`, `Ngành nghề`, `Ngân sách tối đa`, `Diện tích tối thiểu`, `Ghi chú`; mỗi dòng một khách. SĐT nên đặt kiểu Text để giữ số 0 đầu; dùng số thuần cho cột ngân sách triệu/tháng và diện tích m².
- Ảnh JPG/PNG/WebP được lưu ở kho riêng. Chưa bật OCR thì không tự đọc ảnh; mục Các lần nhập gần đây sẽ ghi Cần kiểm tra và có ô dán nội dung rồi Xử lý lại. File không hỗ trợ/PDF scan cũng được giữ để xử lý, không tự đoán.
- OCR ảnh là tùy chọn có phí: nếu đã có OPENAI_API_KEY với số dư, thêm CUSTOMER_IMAGE_OCR_ENABLED=true. Ảnh khi đó được gửi tới OpenAI để chép chữ; dữ liệu OCR có thể sai, hồ sơ thiếu/mâu thuẫn vẫn cần kiểm tra. Không có khóa: nhập văn bản để dùng miễn phí. PDF scan hiện cần chuyển thành ảnh từng hồ sơ để OCR hoặc dán văn bản.
- Định dạng `.doc`, `.xls`, ZIP và các định dạng khác chưa hỗ trợ phân tích trực tiếp: chuyển sang DOCX/XLSX/PDF có chữ. Video không dùng làm hồ sơ khách.
- Bản gốc chỉ mở sau khi kiểm tra quyền ở máy chủ; liên kết tải ký riêng hết hạn sau 60 giây.

## 5. Thông báo gợi ý
Khi thêm/sửa khách hoặc một tin được duyệt/tự đăng, website đối chiếu lại kho khách đang tìm và đang chăm sóc. Kết quả xem trực tiếp trong hồ sơ. Các cặp khách–tin mới có thông báo qua bot khách riêng (nếu đã kết nối), tránh gửi lặp. Bot chỉ báo cho admin; không tự nhắn cho khách. Gửi Telegram lỗi không xóa hồ sơ; kết quả vẫn xem trên website. Lần đối chiếu sau sẽ thử lại thông báo chưa gửi. Hàng đợi nhập được giữ trong database; cron phục hồi hiện chạy hàng ngày nếu đã cấu hình CRON_SECRET, không phải tác vụ chạy mỗi phút.

## 6. Nối Google Sheets
Đồng bộ một chiều từ website sang Google Sheets; sửa trong Sheets không tự sửa dữ liệu website. Dùng MỘT TỆP RIÊNG cho chức năng này vì hệ thống sẽ ghi lại ba tab do nó quản lý.

1. Mở https://console.cloud.google.com → tạo/chọn một Project.
2. APIs & Services → Library → tìm Google Sheets API → Enable.
3. IAM & Admin → Service Accounts → Create service account → đặt tên, ví dụ `nguonbds-sheet`. Không cần cấp Project Owner.
4. Mở tài khoản dịch vụ vừa tạo → Keys → Add key → Create new key → JSON. Tải và giữ kín file JSON.
5. Mở file JSON để lấy `client_email`. Đây là email dùng để chia sẻ Sheet, không phải token.
6. Tạo Google Sheet RIÊNG bằng tài khoản Google của anh, đặt tên `Quản lý khách và nguồn BĐS`. Bấm Share → thêm client_email → chọn Editor. Để General access là Restricted. Ai được xem Sheet có thể xem hồ sơ mọi khách đã đồng bộ, kể cả khách thành viên; không chia sẻ tệp này công khai hoặc cho thành viên chỉ được xem khách của họ trên website.
7. Địa chỉ Sheet có dạng `https://docs.google.com/spreadsheets/d/MA_TEP/edit`. Sao chép riêng MA_TEP.
8. Vercel → Environment Variables → Production:
   - GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON: toàn bộ nội dung file JSON (giữ kín, không dán vào chat).
   - CUSTOMER_GOOGLE_SHEET_ID: MA_TEP.
   - CUSTOMER_SHEETS_AUTO_SYNC: `true` nếu muốn tự đồng bộ sau khi thay đổi khách/nguồn. Để `false` nếu chỉ muốn bấm thủ công.
9. Redeploy bản Production mới nhất → chờ Ready.
10. Quản trị → Khách theo dõi riêng → Đồng bộ Google Sheets. Khi thành công, mở Sheet, có 3 tab:
    - Khach_theo_doi: hồ sơ khách, người quản lý, ghi chú và lịch chăm sóc.
    - Nguon_con_hang: thông tin nguồn công khai đang còn hàng; không xuất số chủ nhà, Map riêng hoặc hoa hồng.
    - Goi_y_khop: các cặp khách và nguồn khớp để anh tiện liên hệ.
11. Không ghi dữ liệu thủ công vào 3 tab này: nội dung của chúng được làm mới mỗi lần đồng bộ. Anh có thể tạo tab ghi chú khác, hệ thống không sửa tab đó. Số điện thoại ghi bằng RAW, giữ dạng chuỗi và không chạy công thức từ nội dung nhập.

Nếu chưa cấu hình hoặc Google từ chối quyền, website vẫn lưu khách bình thường; bấm Đồng bộ để xem lỗi và thử lại sau khi sửa. Không đánh dấu kết nối hoàn tất chỉ vì đã nhập khóa: cần nhận tin thử và thấy dữ liệu thật trong Sheet.

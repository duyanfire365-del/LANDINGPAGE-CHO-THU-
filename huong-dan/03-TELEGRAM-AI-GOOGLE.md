# Kết nối từng cổng
Làm từng phần, thử thành công rồi mới chuyển phần tiếp theo. Không cần bật hết để xem bản mẫu.

## A. Bot thông báo khách quan tâm
1. Telegram → @BotFather có xác minh → /newbot → đặt tên và username kết thúc bằng bot.
2. Lưu token riêng; mở bot vừa tạo, bấm Start và gửi một câu.
3. Trên máy riêng mở `https://api.telegram.org/botTOKEN_CUA_BAN/getUpdates`. Thay TOKEN_CUA_BAN bằng token, không gửi URL đã thay cho người khác.
4. Trong kết quả lấy message → chat → id, không lấy update_id hay message_id. Nếu result rỗng, gửi thêm tin cho đúng bot rồi tải lại. Bot có webhook đang hoạt động có thể không dùng được getUpdates; không xóa webhook đang dùng chỉ để lấy ID.
5. Đặt TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong Vercel → Redeploy.
6. Quản trị → Kiểm tra kết nối → Gửi thử Telegram. Sau đó gửi một nhu cầu giả từ website, xác nhận thực sự có tin đến.

## B. Bot nguồn hàng và bot khách theo dõi
Tạo hai bot khác, không dùng chung bot thông báo. Bot nguồn dùng TELEGRAM_SOURCE_BOT_TOKEN, TELEGRAM_SOURCE_OWNER_ID; TELEGRAM_SOURCE_BOT_USERNAME là username của bot nguồn của chính bạn, không có @. Bot khách dùng TELEGRAM_CUSTOMER_BOT_TOKEN, TELEGRAM_CUSTOMER_OWNER_ID. OWNER_ID là ID tài khoản được phép gửi.
Vào quản trị, cấu hình/bật kết nối bot tương ứng, theo hướng dẫn hiện trên giao diện. Chỉ gửi tài liệu giả để thử. Cần webhook HTTPS của bản triển khai để nhận tin tự động; cấu hình token đơn thuần chưa đảm bảo đã nhận tin.
Giữ TELEGRAM_AUTO_PUBLISH=false lúc đầu. Đối chiếu bản tách thông tin trước khi bật. TELEGRAM_SOURCE_MODE=provided dùng ảnh đính kèm và luật tách dữ liệu; chế độ ai cần khóa API và có thể phát sinh phí. Các tệp không đọc được/không đủ thông tin cần xử lý kiểm tra, không bảo đảm mọi định dạng đều tự đăng được.

## C. AI viết nội dung và tạo ảnh
Chọn AI_PROVIDER=openrouter hoặc openai, đặt khóa đúng nhà cung cấp và AI_MODEL. AI tạo ảnh cần OPENAI_API_KEY và SOURCE_IMAGE_MODEL tương thích. Không có khóa vẫn có bản nháp theo luật. Ảnh sinh chỉ là minh họa, không thể hiện hiện trạng tài sản. Dữ liệu thiếu cần người đăng xác nhận, AI không được bịa.

## D. Google Sheets và Docs
1. Google Cloud Console → chọn/tạo project riêng.
2. APIs & Services → Library → bật Google Sheets API, Google Docs API; bật Google Drive API nếu dùng các chức năng đọc tệp/Apps Script liên quan.
3. IAM & Admin → Service Accounts → Create service account. Đặt tên tùy ý. Không cần cấp Owner/Editor toàn dự án cho việc đọc tài liệu được chia sẻ.
4. Mở tài khoản vừa tạo → Keys → Add key → Create new key → JSON. Tải về và giữ kín.
5. Trong JSON lấy client_email. Tạo Sheet/Docs thử → Share → thêm email đó với Editor. Không bật Anyone with the link cho danh sách khách.
6. Đưa toàn bộ JSON vào GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON ở Vercel, giữ cấu trúc và private_key nguyên vẹn. Không dán JSON vào public hoặc tài liệu dạy học. Redeploy.
7. Trên website quản trị → Cổng Google Docs / Sheets → tạo lệnh nhập hoặc xuất, chọn loại nguồn hàng hay khách, nhập ID tệp. ID nằm giữa /d/ và dấu / tiếp theo trong URL. Thử xem trước một dòng/một bài, đối chiếu kết quả, rồi thực hiện lệnh.
8. Nếu cần tự đồng bộ khách ra Sheet, đặt CUSTOMER_GOOGLE_SHEET_ID; chỉ bật CUSTOMER_SHEETS_AUTO_SYNC=true sau khi thử. Đây là dữ liệu kín.

## E. Dán bài và ảnh lên Docs để tự nhập
1. Tạo Google Docs thử, chia sẻ cho service account. Mỗi tin một khối, có mã tin duy nhất, tiêu đề, giá, diện tích; chèn ảnh ngay trong khối tương ứng. Không trộn ảnh nhiều tin thiếu ký hiệu nhận biết.
2. Tạo lệnh nguồn Google Docs trên cổng website, lấy mã lệnh. Kiểm tra nhập thủ công thành công trước.
3. Tạo GOOGLE_DOCS_AUTOMATION_SECRET ngẫu nhiên ít nhất 32 ký tự, đặt trong Vercel → Redeploy.
4. Vào script.google.com → New project → dán integrations/google-docs-source.gs.
5. Project Settings → Script properties: tạo WEBSITE_URL (https://ten-mien-cua-ban), WEBSITE_GOOGLE_KEY (khớp khóa tự động ở bước 3), GOOGLE_COMMAND_ID (mã lệnh), GOOGLE_DOC_ID (ID Docs).
6. Chạy guiNguonGoogleDocs lần đầu, chấp thuận các quyền cần thiết của tài khoản bạn. Mở Triggers → Add Trigger → chọn guiNguonGoogleDocs → Time-driven → Every 5 minutes.
7. Dán một bài/ảnh giả vào Docs, chờ ít nhất vài phút, xem lịch sử lệnh và kết quả trên website. Script đợi tài liệu ngừng sửa khoảng hai phút; không phải cập nhật tức thời. Trạng thái review là cần kiểm tra, không phải đã đăng toàn bộ.
8. Xuất ngược: tạo lệnh xuất từ cổng Google, chọn đúng loại dữ liệu và tài liệu đích. Thử bằng một bản sao rỗng. Các lệnh chạy lịch phụ thuộc cron và hạn mức dịch vụ.

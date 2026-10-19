# Kết nối bot nhận nguồn

Bot: @Nguonbdschothueduy_inbox_bot. Đây là bot riêng, không thay token của bot thông báo khách hàng.

1. Supabase → SQL Editor → New query: chạy nội dung `database/004_source_inbox.sql` một lần.
2. Trong Telegram mở bot @userinfobot, bấm Start để xem Id tài khoản cá nhân. Chỉ lấy dãy số Id của chính anh, không phải Id bot. Không gửi token cho bot này.
3. Vercel → webchothue → Settings → Environment Variables → thêm cho Production:
   - `TELEGRAM_SOURCE_BOT_TOKEN`: token BotFather cấp cho đúng bot nhận nguồn. Chọn Secret.
   - `TELEGRAM_SOURCE_OWNER_ID`: Id tài khoản cá nhân ở bước 2.
4. Deployments → deployment mới nhất → Redeploy. Mã website phải có chức năng nhận nguồn trước khi thực hiện bước 5.
5. Đăng nhập https://nguonchothue.vn/admin → Nguồn từ bot Telegram → Kết nối bot nhận nguồn. Nút này kiểm tra đúng bot, kiểm tra bảng dữ liệu, rồi đăng ký webhook HTTPS. Không cần tự mở đường dẫn chứa token.
6. Mở bot → Start → gửi một bài văn bản thử. Quay lại admin → Tải nguồn mới. Chỉ tài khoản cá nhân đã cấu hình gửi riêng cho bot mới được nhận nguồn.

## Phạm vi hiện tại

Nguồn lưu kín trong Supabase, không đưa ra trang công khai. Tin giống hệt nội dung và mã tệp được bỏ qua bằng ràng buộc duy nhất của cơ sở dữ liệu. Tin thay giá hoặc diễn đạt lại vẫn được giữ để quản trị viên đối chiếu; chưa dò trùng gần giống với kho tin đã đăng.

Ảnh/video/tài liệu mới lưu mã tham chiếu Telegram, chưa sao lưu tệp vào Supabase, chưa tự đọc tài liệu hoặc nhóm album thành tin. Tạm xem/tải tệp ở Telegram và nhập bằng trình soạn tin hiện có. Mỗi tin nhắn trong album là một nguồn có cùng mã nhóm. Không nhận nội dung chỉnh sửa sau khi gửi; gửi một tin mới để cập nhật nguồn.

Nguồn văn bản có nút sao chép để soạn tin thủ công. Chưa tự tạo bản nháp bằng AI; cần khóa AI và bước tích hợp xử lý riêng. Mọi tin đăng qua trình soạn vẫn phải duyệt trước khi công khai. Giữ số nhà, ngõ/ngách, hashtag trong phần riêng tư.

Bot chưa gửi tin xác nhận khi nhận nguồn; kiểm tra bằng nút Tải nguồn mới. Hộp hiển thị 50 nguồn gần nhất, bản ghi cũ vẫn còn trong cơ sở dữ liệu.

Webhook có chữ ký bí mật dẫn xuất từ token và kiểm tra cả người gửi, cuộc trò chuyện riêng. Không ghi token vào mã, log hoặc chat. Nếu token bị lộ, thu hồi qua BotFather, thay biến Vercel, Redeploy rồi bấm Kết nối lại. Không dùng cùng bot với dịch vụ webhook khác vì Telegram chỉ hỗ trợ một webhook cho một bot.

## Nâng cấp tự đăng

Đã bổ sung chế độ tự phân tích văn bản, tạo ảnh AI và đăng tự động khi bật riêng. Xem `TELEGRAM_AUTO_PUBLISH.md`, chạy migration 005 và nhập khóa OpenAI có số dư. Những giới hạn về soạn thủ công ở trên áp dụng khi chưa bật chế độ này.

# Tự đăng bằng ảnh gửi kèm, không dùng API AI trả phí

## Bật chế độ

1. Đã có bot nhận nguồn và các biến TELEGRAM_SOURCE_BOT_TOKEN, TELEGRAM_SOURCE_OWNER_ID, Supabase như hướng dẫn trước.
2. Trong Supabase SQL Editor chạy `database/005_source_automation.sql` một lần nếu chưa chạy. Không cần SQL mới khác cho chế độ ảnh gửi kèm.
3. Vercel → webchothue → Settings → Environment Variables → Production:
   - `TELEGRAM_AUTO_PUBLISH` = `true`
   - `TELEGRAM_SOURCE_MODE` = `provided`
   - `TELEGRAM_AUTO_DAILY_LIMIT` = `20` hoặc hạn mức anh muốn, tối đa 100.
4. Deployments → deployment chứa mã mới → Redeploy → chờ Ready.
5. Không cần OPENAI_API_KEY. Nếu khóa đã có thì luồng nguồn ở chế độ provided cũng không gọi OpenAI; tính năng chat khác dùng AI nếu được cấu hình vẫn có thể phát sinh phí riêng.

## Gửi bài

Mở @Nguonbdschothueduy_inbox_bot → chọn một ảnh hoặc tối đa 10 ảnh → nếu nhiều ảnh, gửi dạng album → dán bài vào phần chú thích ảnh/album → Gửi.

Mẫu nội dung (thay bằng dữ liệu BĐS thật trước khi gửi vì bài hợp lệ sẽ tự đăng):

```
Loại BĐS: Văn phòng
Địa chỉ: Số nhà và tên đường đầy đủ, quận/huyện, Hà Nội
Tên đường: Chỉ tên đường, không số nhà/ngõ/ngách
Khu vực: Cầu Giấy
Diện tích: 100 m²
Giá thuê: 20 triệu/tháng
#hashtagcuanguon
```

Tên đường bắt buộc khi địa chỉ có số ngõ/ngách. Khu vực theo 30 quận/huyện và thị xã cũ. Mỗi lần gửi một BĐS. Chọn đúng danh mục đã có trên website.

Không bắt buộc dùng đúng mẫu nếu bài tự do đủ thông tin rõ ràng mà quy tắc nhận diện được. Bài thiếu dữ liệu, có nhiều mức giá hoặc nhiều diện tích sẽ giữ trong admin để kiểm tra, không tự đoán. Thuật toán chỉ ghép mô tả từ dữ kiện đã tách, không viết lại tự do như AI. Chưa đọc chữ trong ảnh/tài liệu, chưa tách bài bán. Nếu có sang nhượng, ghi riêng dòng `Sang nhượng: ... triệu` ngoài giá thuê hàng tháng.

Ảnh không có bài chú thích, hoặc bài và ảnh gửi thành các tin riêng lẻ, không tự được ghép. Gửi một album có đúng một chú thích nội dung. Telegram gửi từng ảnh qua webhook; hệ thống đợi khoảng 4 giây để gom và chỉ nguồn có chú thích được làm bài chính. Ảnh album đến quá muộn sau khi bài đã xử lý được giữ để kiểm tra, không tự gắn nhầm sang bài khác.

## Xử lý

- Nhận nguồn → tách trường theo quy tắc → kiểm tra địa chỉ/diện tích với kho tin cũ → tải ảnh từ Telegram → lưu Supabase → ghép bài và tự đăng.
- Không tạo ảnh AI, không gửi nguồn/ảnh đến OpenAI, không cần mua API để chạy luồng này. Vẫn chịu hạn mức/phí lưu trữ, băng thông và máy chủ của Supabase/Vercel theo gói đang dùng; không cam kết website miễn phí không giới hạn.
- Ảnh JPEG, PNG, WebP tối đa 10 MB mỗi ảnh, tối đa 10 ảnh mỗi bài. Ảnh gửi dạng ảnh Telegram được hỗ trợ; tài liệu JPEG/PNG/WebP cũng được nhận diện là ảnh. Video/tệp Word/PDF chưa tự đăng qua luồng này.
- Nhãn ảnh là “Ảnh do nguồn cung cấp”, không gọi là ảnh AI hay tự xác nhận ảnh thực tế. Hệ thống không OCR hoặc tự che số nhà/ngõ/ngách, hashtag, thông tin liên hệ nằm TRONG ảnh. Anh chọn ảnh không chứa những chi tiết riêng tư này trước khi gửi. Địa chỉ và hashtag trong bài văn bản được giữ riêng như trước.
- Bot gửi kết quả kèm liên kết sau khi đăng. Admin → Nguồn từ bot Telegram → Tải nguồn mới để xem kết quả, nguồn trùng và bài cần kiểm tra.
- Kiểm tra trùng theo quy tắc hiện có, không bảo đảm nhận ra mọi cách ghi khác nhau. Tin trùng không đăng thêm và không tự ghi đè giá.

Kiểm thử dùng Telegram/Supabase giả lập: xác minh một ảnh, album hai ảnh, không có khóa OpenAI và không có cuộc gọi OpenAI; thiếu ảnh giữ lại; ảnh được lưu riêng và gắn vào bài công khai sau khi đăng. Cần gửi bài thật sau khi cấu hình Production để xác nhận đầu cuối trên website.

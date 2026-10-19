# Tự đăng nguồn Telegram cùng ảnh AI

## Bật lần đầu

Bot nhận nguồn: @Nguonbdschothueduy_inbox_bot. Luồng nhận nguồn cũ vẫn hoạt động khi chưa bật tự đăng.

1. Trong Supabase → SQL Editor → New query, chạy toàn bộ `database/005_source_automation.sql`. Bảng nguồn từ migration 004 phải tồn tại trước. Đây là bước cần làm thêm một lần, không chạy SQL trên GitHub.
2. Mở https://platform.openai.com/ và đăng nhập/tạo tài khoản. Dịch vụ API tính phí riêng, không phải gói ChatGPT Plus.
3. Mở Billing: https://platform.openai.com/settings/organization/billing/overview → Add payment details → thêm phương thức thanh toán → Add to credit balance/Buy credits nếu tài khoản hiển thị nạp trước. Chọn số tiền nhỏ phù hợp mức tối thiểu đang hiển thị. Có thể tắt tự động nạp lại để dễ kiểm soát. Giao diện/tùy chọn tùy tài khoản/quốc gia. Đặt cảnh báo ngân sách trong OpenAI; cảnh báo không bảo đảm là giới hạn chi tiêu cứng.
4. Mở https://platform.openai.com/api-keys → Create new secret key → đặt tên `NguonChoThue` → sao chép khóa. Lưu riêng; không gửi khóa qua chat, ảnh chụp màn hình hay Telegram. Nếu model ảnh yêu cầu xác minh tổ chức, hoàn tất hướng dẫn trong OpenAI. Không có quyền model ảnh hoặc hết số dư thì nguồn được giữ lại, không tự đăng thiếu ảnh.
5. Vercel → webchothue → Settings → Environment Variables → thêm cho Production:
   - `OPENAI_API_KEY`: khóa bước 4, loại Secret.
   - `TELEGRAM_AUTO_PUBLISH`: `true`.
   - `TELEGRAM_AUTO_DAILY_LIMIT`: `5` để bắt đầu ít bài mỗi ngày. Đây là hạn mức số nguồn bắt đầu xử lý, không phải trần tiền. Mỗi nguồn tối đa 3 lần thử; chạy lại có thể phát sinh thêm phí nếu lần trước chưa lưu xong ảnh.
   - Tùy chọn `CRON_SECRET`: chuỗi ngẫu nhiên riêng tối thiểu 32 ký tự, loại Secret, để bật đợt khôi phục hàng chờ mỗi ngày. Có thể tạo bằng trình quản lý mật khẩu; không dùng mật khẩu admin. Nếu chưa đặt, đợt khôi phục sẽ từ chối truy cập, còn nhận bài mới vẫn chạy tự động.
6. Giữ nguyên `TELEGRAM_SOURCE_BOT_TOKEN`, `TELEGRAM_SOURCE_OWNER_ID` và các khóa Supabase đang hoạt động. Không thay token bot thông báo khách hàng.
7. Deployments → deployment chứa mã mới → Redeploy → chờ Ready. Mã model mặc định: `gpt-4o-mini` để phân tích, `gpt-image-1` để tạo JPEG chất lượng low. Có thể đặt `SOURCE_AI_MODEL`/`SOURCE_IMAGE_MODEL` nhưng chỉ dùng model tương thích định dạng API hiện tại.
8. Gửi một bài văn bản có đủ loại BĐS, đường + địa chỉ cụ thể, quận/huyện cũ, diện tích m² và giá thuê triệu/tháng vào bot. Chờ vài phút. Bot báo kết quả kèm liên kết nếu đăng thành công. Admin → Nguồn từ bot Telegram → Tải nguồn mới để xem trạng thái.
9. Gửi lại cùng bài để xác nhận không có tin mới. Kiểm tra trang khách hàng không chứa số nhà, ngõ/ngách hoặc hashtag. Các nguồn đã nhận trước khi bật tự đăng không tự chạy hàng loạt: có nút Xử lý / Thử lại để chọn chạy từng nguồn.

## Cách vận hành

Webhook xác nhận nhanh sau khi lưu nguồn. Vercel waitUntil giữ tác vụ nền tối đa 300 giây; không cần giữ trình duyệt mở. Supabase giữ trạng thái và khóa xử lý để hai yêu cầu không tự đăng cùng nguồn. Đợt khôi phục Vercel Cron chạy mỗi ngày lúc 02:00 UTC, tối đa 2 nguồn/lượt, chỉ khi có CRON_SECRET. Đây là khôi phục khi gián đoạn; luồng bình thường xử lý ngay sau khi nhận tin, không chờ cron. Có nút thử lại trong quản trị. Tối đa 3 lần thử mỗi nguồn; hết lượt thì soạn/kiểm tra thủ công.

Chỉ tài khoản cá nhân đã cho phép gửi riêng vào bot mới kích hoạt tự đăng. Thành viên/sale gửi qua website vẫn chờ duyệt như trước. Có thể tắt tự đăng bằng `TELEGRAM_AUTO_PUBLISH=false` rồi Redeploy; bài mới vẫn được lưu riêng, tác vụ đã bắt đầu có thể hoàn tất.

## Dữ liệu và giới hạn

- Nội dung nguồn đầy đủ được gửi đến OpenAI API để trích xuất, rồi được lưu riêng trong Supabase. Prompt tạo ảnh chỉ dùng danh mục, không gửi địa chỉ cụ thể, hashtag hoặc tên nguồn. Ảnh công khai ghi rõ là minh họa AI, không mô tả là ảnh thực tế.
- Tiêu đề, mô tả công khai được ghép từ các trường đã kiểm tra, không đăng nguyên văn bài nguồn. Giá thuê, diện tích, số tầng/mặt tiền nếu có phải có trích dẫn nguyên văn đúng con số/đơn vị. Hashtag, địa chỉ và bài gốc chỉ nằm trong dữ liệu quản trị. Không tự đưa số liên hệ bên nguồn vào bài công khai; dùng hotline website.
- Một bài chứa một BĐS cho thuê. Nhiều BĐS, thiếu quận/địa chỉ cụ thể, thiếu giá hoặc diện tích, nhiều lựa chọn giá không rõ, chỉ có ảnh/tệp, hoặc bài bán sẽ giữ lại ở trạng thái cần kiểm tra. Chưa đọc album/tài liệu/ảnh để tự đăng. Bài chuyển nhượng phải xác định được cả giá thuê tháng và giá chuyển nhượng một lần. Triều Khúc áp dụng Thanh Trì, Phạm Huy Thông áp dụng Ba Đình theo đính chính của chủ website.
- Kiểm tra trùng với 30 tin tĩnh đã mã hóa và kho tin trong Supabase. So khớp địa chỉ đã chuẩn hóa, quận và diện tích; khóa fingerprint trong DB chặn các nguồn cùng BĐS nhận đồng thời. Tin cùng địa chỉ/diện tích nhưng đổi giá được giữ ở trạng thái trùng, không đăng bản thứ hai hay tự sửa giá cũ. Kiểm tra tất cả trạng thái tin trong kho, kể cả tin đã gỡ.
- Không thể bảo đảm nhận ra mọi cách viết khác nhau/địa chỉ sai/diện tích đổi. Trường hợp khác căn cùng địa chỉ và diện tích có thể bị coi là trùng; quản trị viên đối chiếu nguồn nếu cần. Không tuyên bố dò trùng tuyệt đối bằng AI.
- Giới hạn mặc định 20 nguồn bắt đầu xử lý/ngày UTC (khuyên đặt 5 lúc thử). Giá OpenAI theo model và bảng phí hiện hành; có phí phân tích cả khi phát hiện trùng gần giống sau bước AI. Tin giống hệt nhận lại không gọi AI khi đã hoàn tất.
- Chưa thể xác nhận chạy OpenAI/Supabase thật từ môi trường phát triển khi chưa có cấu hình. Kiểm thử dùng máy chủ giả lập; cần anh cấu hình và gửi bài thử để xác nhận đầu cuối trên tên miền.

## Dùng ảnh sẵn để không cần API AI

Đã có chế độ `TELEGRAM_SOURCE_MODE=provided`: tách trường bằng quy tắc và dùng ảnh Telegram gửi kèm. Xem `TELEGRAM_PROVIDED_PHOTOS.md`. Các yêu cầu nạp tiền và tạo khóa OpenAI ở trên chỉ áp dụng chế độ `ai`.

# Telegram tự đăng bằng quy tắc — không gọi API AI

Theo cấu hình của chủ website, luồng Telegram dùng bộ quy tắc cố định; khóa OpenAI, OpenRouter, Gateway và các biến AI cũ không tự bật lại xử lý tính phí. `automationConfiguration()` phản ánh chế độ thực tế `provided`, `paidAI: false`, `autoImages: false`.

## Vận hành

- Giữ nguyên bot, webhook, owner ID và Supabase. Bật `TELEGRAM_AUTO_PUBLISH=true` như hiện tại.
- Cài SQL 004, 005 và migration `database/migrations/20261107_source_intake_quota.sql` cho dự án mới. Dự án đang chạy đã có migration không cần chạy lại SQL 005.
- RPC nhận `daily_limit=0` cho nhập tin theo quy tắc; không còn hạn mức 20 tin/ngày. Khóa xử lý, thời gian giữ việc 10 phút, chống trùng và tối đa 3 lần thử vẫn có hiệu lực.
- Mỗi lần gửi một BĐS; văn bản tự do và nhiều kiểu viết tắt được hỗ trợ, không bắt buộc một form cố định. Thiếu thông tin thì chờ cập nhật, không tự bịa số liệu. Mâu thuẫn hoặc nhiều BĐS được giữ lại để kiểm tra.
- Bộ đọc phân biệt Cho thuê, Bán và cả hai giá của cùng BĐS; nhận DT, MT, số tầng, giá theo triệu/tỷ, đơn giá/m², sang nhượng, khu vực và nguồn liên hệ. Số nhà, ngõ/ngách, nguồn, số nguồn và hoa hồng mặc định được giữ riêng.
- Reply bài gốc để bổ sung, sửa, thay nội dung, giá hoặc ảnh theo luồng cập nhật hiện có.

## Ảnh không cần API

- Ảnh Telegram được lưu bền vững trong Supabase. Không gửi ảnh sang dịch vụ vision để kiểm tra tính phí.
- Ảnh chưa có chỉ dẫn được giữ riêng; bot hỏi chủ chọn công khai (1) hoặc giữ riêng (0). Chỉ dẫn công khai/giữ riêng rõ ràng vẫn có hiệu lực. Không tự xác nhận ảnh không có thông tin nhạy cảm.
- Không có ảnh: dùng kho ảnh minh họa theo danh mục. Kho luân phiên theo ảnh gốc/nhóm hình tương tự, cách ít nhất 20 tin trong thứ tự danh sách chung và trong danh mục. Khi kho đúng bối cảnh thiếu ảnh, dùng đồ họa dựng tại máy chủ với 8 bố cục × 8 bảng màu, cũng theo giãn cách này. Ảnh thật do người đăng cung cấp được giữ nguyên.
- Nhãn minh họa được ghi rõ; đồ họa không phải ảnh chụp BĐS thực tế. Dựng ảnh dùng Sharp/font nội bộ, không gọi dịch vụ AI.
- Hồ sơ khách Telegram bằng ảnh được lưu riêng và yêu cầu gửi thêm văn bản; không tự chạy OCR AI dù biến OCR cũ đang bật.

Các nút AI thủ công ở nơi khác trên website và chat AI là tính năng riêng, không thuộc chính sách miễn gọi AI của luồng Telegram này. Lưu trữ, băng thông và máy chủ vẫn theo gói hạ tầng đang dùng.

## Kiểm tra

`node tests/source-automation.mjs`: 25 tin liên tiếp, giá thuê/bán/sang nhượng, album, sửa tin, chống trùng, dữ liệu riêng tư; không gọi API AI kể cả có khóa và biến bật AI cũ.

`node tests/media-privacy.mjs`: Telegram giữ ảnh chưa duyệt, không gọi vision; lựa chọn công khai/riêng vẫn đúng quyền.

`node tests/illustration-spacing.mjs`: 180 tin không lặp ảnh gốc/kiểu đồ họa trong vòng 20 tin; dựng nhiều bố cục 1200×800 không có cuộc gọi mạng.

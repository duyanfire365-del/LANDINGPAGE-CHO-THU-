# Dịch vụ hỗ trợ và tuyển dụng

Hai chuyên mục công khai: `/dich-vu-ho-tro`, `/tuyen-dung`, dùng chung CMS bài viết, rich text, ảnh bìa, nháp/công khai/gỡ, revision và quyền admin hiện có. Bảy bài dịch vụ: đo đạc, ngân hàng, sổ đỏ, công chứng/vi bằng, thừa kế, đất đai khác, Dịch vụ khác; một bài tuyển CTV. Ảnh AI riêng từng bài, lưu WebP ~808 KB tổng, có thể thay trong admin. Menu đầu trang dùng font-weight 600, các mục mới vẫn xuất hiện khi dùng cấu hình menu cũ.

Ngày ở hai mục này chỉ được máy chủ trả cho admin. Thành viên có quyền đăng tin vẫn không thấy ngày của services/recruitment. Các quy tắc ngày của news/experience giữ nguyên. Nội dung có sẵn là giới thiệu, không cam kết pháp lý, giải ngân, thu nhập hoặc thù lao; vi bằng không thay thế công chứng và thủ tục bắt buộc. Không tự sửa bài đã được admin chỉnh.

## Đăng ký

Nút quan tâm mở trợ lý 6 bước với gợi ý theo dịch vụ: tên, tuổi, khu vực, điện thoại, nhu cầu, mức độ gấp; xem lại và tích đồng ý trước khi gửi. Tuổi không bắt buộc cho dịch vụ; CTV cần đủ 18 tuổi. Không có LLM/API trả phí hay tự gửi nội dung khi đang điền; không lưu bản nháp thông tin cá nhân trong trình duyệt. Đây là luồng hỏi đáp có điều kiện, không phải chatbot AI sinh nội dung.

POST `/api/leads?services=1` lưu riêng vào `service_requests`, rồi thông báo qua `notify()` dùng TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID hiện có (bot thông báo website). Không ghi thành khách thuê, không khởi chạy matching BĐS. UUID+hash chống gửi lặp; kiểm tra origin, giới hạn kích thước/tần suất, chuẩn hóa số điện thoại, kiểm tra consent. Chỉ admin GET được danh sách. Dữ liệu không được cấp quyền anon/authenticated; RLS bật.

Trạng thái gửi `pending/sending/sent/failed`; gửi có claim để tránh hai tiến trình gửi cùng lúc. Admin xem hồ sơ, đổi trạng thái liên hệ và gửi lại thông báo lỗi. Claim bị gián đoạn chỉ khôi phục sau 5 phút. Telegram và DB không có giao dịch chung: nếu Telegram nhận nhưng DB chưa ghi sent, retry có thể tạo thông báo trùng; mã đăng ký giúp nhận diện. Không tuyên bố đã gửi Telegram khi chỉ lưu được hồ sơ.

## Triển khai

`database/migrations/20261106_support_services.sql` mở rộng enum chuyên mục/chủ đề và tạo bảng riêng có index, RLS và grant service_role. Không sửa tin/news cũ. Triển khai ứng dụng rồi khởi tạo 8 bài bằng SQL do `node scripts/service-seed-sql.mjs <key>` tạo; ảnh lấy từ public/service-images. `on conflict do nothing` giữ nguyên bài đã tồn tại và chỉnh sửa thủ công. Script không đọc credential, không gửi Telegram.

Kiểm tra: `tests/support-services.mjs`, `tests/services-ui.mjs`, `tests/article-date-access.mjs`, `tests/news.mjs`, `tests/mbkd-experience.mjs`, `tests/news-ui.mjs`, `tests/sale-ui.mjs`. Fixture chỉ gửi Telegram giả lập, không tạo đăng ký thử trên production.

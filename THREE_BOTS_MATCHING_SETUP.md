# Ba bot mới và khớp khách tổng hợp

Bản cập nhật này **code ba kênh gửi bot và bộ đối chiếu**, không tạo tài khoản Telegram bằng BotFather thay người dùng. Chưa có token/chat ID mới và chưa gửi Telegram thật trong phiên phát triển. Không kích hoạt máy quét Facebook/website, không tự đăng bài và không thay bot cũ. Các kiểm thử dùng dữ liệu/bot giả.

## Ba vai trò

1. **Thông tin nguồn BĐS được quét & ký gửi**: nhận nguồn quét đã lưu trong Tin quét, cùng hồ sơ chủ nhà ký gửi trực tiếp qua biểu mẫu. Nguồn quét kèm đúng link bài gốc, tên/SĐT/Zalo nếu có, khu vực, giá/diện tích, căn cứ và trạng thái tự khai/xác minh. Ký gửi qua biểu mẫu không có bài FB bên ngoài thì ghi rõ nguồn là biểu mẫu, kèm mã hồ sơ và link quản trị; không tạo link bài gốc giả.
2. **Thông tin KH được quét**: nhận khách quét từ Web/FB cùng link bài gốc và tiêu chí đã trích. Không đoán tài khoản Zalo hay danh tính còn thiếu.
3. **Khớp nguồn cho khách**: gom khách quét, khách chủ động đăng ký website, khách CRM do admin/thành viên nhập (gồm hồ sơ được nhập bởi bot Telegram cũ). Chỉ gửi các cặp đạt đủ tiêu chí đã chuẩn hóa. Tin gửi có nguồn khách/bài gốc hoặc mã hồ sơ quản trị, link BĐS công khai, giá/diện tích và lý do phù hợp.

Ba bot này chỉ là **bot thông báo cho quản trị**, không tự nhắn cho khách/người đăng, không thay bot Telegram nhận nguồn/khách đang dùng và không đổi webhook cũ. Bot mới không cần webhook. Các luồng thông báo/gợi ý cũ vẫn giữ nguyên; bot khớp mới dùng bộ lọc chặt hơn, không âm thầm sửa thuật toán cũ.

## Tạo và cấu hình

1. Trên Telegram của anh, mở **@BotFather** chính thức, gửi `/newbot` ba lần. Đặt tên hiển thị theo ba vai trò trên; username riêng do BotFather chấp nhận và kết thúc bằng `bot`. Tên gợi ý không có nghĩa username đã được đăng ký.
2. Bấm **Start** cho từng bot mới và gửi một tin nhắn. Nếu nhận vào nhóm, dùng nhóm quản trị riêng, thêm đúng bot và cấp quyền gửi tin. Dữ liệu bot chứa thông tin liên hệ riêng.
3. Chạy cục bộ `python scripts/telegram-chat-id.py` cho từng bot để lấy chat ID. Script dùng thư viện chuẩn Python, hỏi token ẩn, chỉ in tên chat và ID, không lưu token, không in toàn bộ tin nhắn. Không đưa token vào chat hỗ trợ, Git, ảnh chụp hoặc website lấy ID không rõ nguồn.
4. Vercel → project **webchothue** → Settings → Environment Variables → Production. Đặt 6 biến sau (không xóa/sửa biến bot cũ):

| Vai trò | Token | Nơi nhận |
| --- | --- | --- |
| Nguồn BĐS quét & ký gửi | `TELEGRAM_SCANNED_PROPERTY_BOT_TOKEN` | `TELEGRAM_SCANNED_PROPERTY_CHAT_ID` |
| Khách quét | `TELEGRAM_SCANNED_CUSTOMER_BOT_TOKEN` | `TELEGRAM_SCANNED_CUSTOMER_CHAT_ID` |
| Khớp nguồn | `TELEGRAM_MATCH_BOT_TOKEN` | `TELEGRAM_MATCH_CHAT_ID` |

5. Giữ `MATCH_BOTS_ENABLED=0` lúc đầu và Redeploy. Vào `/admin` → **Khách hàng / Công cụ → 3 Bot & Khớp khách**. Thẻ “Đã cấu hình” chỉ kiểm tra sự hiện diện/định dạng; bấm **Gửi thử** riêng từng bot và kiểm tra tin thật trong đúng chat.
6. Kiểm tra dữ liệu, chuẩn hóa tiêu chí và ngành nguồn được phép. Sau đó đặt `MATCH_BOTS_ENABLED=1`, Redeploy và bấm **Đối chiếu & xử lý hàng đợi**. Lần bật đầu có thể đưa các hồ sơ hiện có vào hàng đợi, không chỉ những hồ sơ mới sau lúc bật.

Token phải khác nhau và khác các bot thông báo/nhận nguồn/nhận khách cũ. API trả thông tin sẵn sàng và tên biến, không trả token hoặc chat ID. Tất cả xem/chuẩn hóa/chạy/test đều yêu cầu phiên admin và kiểm tra same-origin cho POST. Không có chức năng cho thành viên xem toàn bộ kho khách hoặc token.

## Khớp thế nào

Kho nguồn chỉ lấy những tin **thực sự công khai** trên website. Tin quét chỉ đánh dấu “Đã Up lên Web” nhưng chưa có bài công khai không tự thành nguồn đối chiếu. Nguồn đã thuê/tạm dừng loại bỏ; nguồn chờ xác nhận không tự gửi như cặp khớp đủ. Dùng cơ chế tồn kho hiện có, trong đó nguồn quá hạn xác nhận còn hàng 30 ngày được chuyển sang chờ xác nhận.

Đối chiếu cứng: loại BĐS, quận/huyện mong muốn và loại trừ, khoảng ngân sách thuê (triệu/tháng), diện tích tối thiểu/tối đa và mặt tiền nếu có yêu cầu, thuê hay sang nhượng, phí sang nhượng riêng nếu có. Tiền sang nhượng không bị nhầm với tiền thuê tháng; trường chưa biết không coi là 0. “Dưới”/“trên” dùng cận loại trừ. Tên khu vực cụ thể như Mỹ Đình không tự được coi là đúng chỉ vì cùng quận.

Mục đích/ngành nghề cần bằng chứng: ngành nguồn cho phép/không cho phép được admin xác nhận trong phần tiêu chí nguồn, hoặc nội dung nguồn nêu rõ phù hợp/cho phép. “Gần quán cà phê” không đủ để khẳng định nguồn cho mở cà phê. Hạn chế/cấm ngành là điều kiện loại trừ. Khách có ngành ghép hoặc yêu cầu tự do chưa chuẩn hóa được giữ ở mức **cần xác nhận**, không gửi vào bot khớp như đã đạt đủ. Bản này chưa dùng AI để suy luận mọi câu chữ hoặc xử lý mọi phủ định/pháp lý.

Admin có thể bổ sung tiêu chí khách một lần trong tab mới; hồ sơ gốc vẫn giữ nguyên. Chỉ đánh dấu đã chuẩn hóa khi đã chuyển **đầy đủ** yêu cầu sang các trường số/khu vực/loại/ngành/tiện ích. Nếu hồ sơ gốc thay đổi thì bộ tiêu chí cũ không tự được áp dụng lại. Có xung đột sửa đồng thời thì yêu cầu tải lại. Tiêu chí ngành/tiện ích nguồn cũng lưu riêng, không sửa nội dung công khai hay chia sẻ điện thoại nguồn ra ngoài.

Không ghép hai người chỉ vì trùng số điện thoại. Chỉ hợp nhất bản sao khi cùng chủ quản lý, tên/SĐT đã chuẩn hóa và toàn bộ tiêu chí khớp; vẫn giữ tất cả xuất xứ. Các hồ sơ khác chủ quản lý được giữ riêng. Bot chọn một link gốc khách ưu tiên và link bài BĐS để tin không vượt giới hạn Telegram; các xuất xứ còn lại xem trong quản trị.

Đây là **khớp theo thông tin đang có**, không chứng minh quyền sở hữu, giấy phép ngành nghề, pháp lý hay khả năng ký hợp đồng. Bộ lọc mới không thay xác minh/liên hệ thực tế. Mục tiêu là tự bỏ các cặp mâu thuẫn và chỉ gửi cặp đủ dữ liệu, không gắn nhãn “khớp 100%” khi còn thông tin chưa rõ.

## Sự kiện, hàng đợi và quy mô

Khi bật cờ, tác vụ được gọi sau nhập kết quả quét, đăng ký qua website, lưu khách admin/thành viên, xử lý nhập khách Telegram/tài liệu và các sự kiện công bố/cập nhật nguồn đã có lời gọi `matchNewStock`. Dùng thêm tác vụ khôi phục hiện có `/api/source-recovery` (cron hiện tại mỗi ngày); không thêm lịch trả phí hoặc quảng cáo rằng cron đang chạy mỗi phút.

Có khóa tác vụ, con trỏ bền và xử lý theo lô: tối đa 100 tin quét, 20 ký gửi, 25 khách/lượt; tối đa 5 cặp đứng đầu/khách/lượt để tránh bão thông báo. Mỗi lần gửi xử lý tối đa 9 thông báo và khoảng 30 giây, luân phiên ba kênh; lô lớn cần nhiều lượt sự kiện/cron/nút chạy. Con trỏ quay vòng, bản ghi đã gửi không tạo lại chỉ vì chạy lặp. Khách lớn hơn 200 hoặc nguồn hơn 500 trong dropdown cần tìm/thu hẹp hoặc mở rộng phân trang quản trị ở phiên bản tiếp. Bộ đọc dữ liệu dừng báo lỗi khi vượt 10.000 bản ghi mỗi kho; không giả vờ đã xử lý đủ.

Thông báo lỗi được giữ lại và thử lại ở lượt tác vụ kế tiếp sau hạn backoff. Telegram 429 tôn trọng thời gian chờ. Trước gửi, tác vụ đọc lại snapshot để hủy các thông báo chưa gửi nếu khách đóng/đổi tiêu chí hoặc nguồn không còn khớp; không có bảo đảm tồn kho không thay đổi sau snapshot. Mạng mất phản hồi sau khi Telegram đã nhận vẫn có thể dẫn đến gửi lặp; không cam kết exactly-once. Bảng chỉ hiển thị 100 thông báo gần nhất, gồm gửi/hủy/lỗi, không chứa token.

Cấu hình lớn hoặc muốn lịch dày hơn cần đánh giá giới hạn Vercel/Supabase và máy chạy nền; không tự nâng gói, thuê proxy hoặc đăng ký dịch vụ. Bản này không kích hoạt việc quét nhóm Facebook.

## Lưu trữ và chi phí

Tái sử dụng `notification_log` server-only cho hàng đợi, khóa/con trỏ, bộ tiêu chí chuẩn hóa; tái sử dụng kho `customer_watch`, `inquiries`, tin quét và tin công khai. Không thêm bảng hoặc thay RLS/grants. Không xóa hay ghi đè dữ liệu gốc.

Không thêm phí mua bot hay API AI; dùng thư viện và hạ tầng đang có, chịu hạn mức/tính phí Vercel/Supabase hiện hành. Không có giao dịch trả phí trong bản cập nhật. Chưa kiểm thử bot thật do chưa có 3 token/chat ID mới được cấu hình và xác nhận.

Kiểm thử: `tests/unified-match-rules.mjs`, `tests/three-bots.mjs`, `tests/matching-bots-ui.mjs` kiểm tra điều kiện cứng, dữ liệu thiếu, xuất xứ, hồ sơ chuẩn hóa, hủy cảnh báo cũ, rate limit/retry/khóa chống trùng, quyền admin, giữ nguồn gốc, giao diện máy tính/điện thoại. Kiểm thử cũ `tests/customers.mjs` và `tests/scan-results.mjs` dùng để kiểm tra hồi quy. Bộ cũ `tests/customer-integrations.mjs` đi tới phần xuất Sheets bị chặn bởi khóa giải mã dữ liệu admin không có trong môi trường kiểm thử; không coi bộ đó là đã đạt toàn bộ.

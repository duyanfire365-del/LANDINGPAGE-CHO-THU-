# Chat tư vấn, AI và nhận nguồn ký gửi

## Phần dùng ngay, không cần API key

- Nút “Chat tư vấn” mở khung chat trên mọi trang, toàn màn hình trên điện thoại.
- Tự trả lời 10 FAQ hiện có. Nhận biết câu hỏi về phí, đặt cọc, hợp đồng, lịch xem và nhu cầu gấp.
- Hai luồng hướng dẫn: khách tìm thuê (loại BĐS, khu vực, ngân sách), chính chủ ký gửi (loại BĐS, khu vực, rồi chuyển tới phần địa chỉ, diện tích, giá dự kiến).
- Điền sẵn biểu mẫu. Không tự gửi thông tin cá nhân khi khách đang gõ hoặc chat.
- Nếu chưa có nơi nhận yêu cầu, biểu mẫu tạo nội dung có thể sao chép. Khách cần mở Zalo 0906215365, dán và gửi; chỉ mở Zalo chưa gửi tin nhắn.
- Không có nhân viên trực tiếp trong khung chat; không xác nhận nhà còn trống, lịch hẹn hay nhận tiền đặt cọc.
- Chat lưu trong bộ nhớ phiên trang, không lưu hội thoại hoặc thông tin khách vào localStorage/database.

## Bật AI hội thoại trên Vercel

Vào dự án webchothue > Settings > Environment Variables. Không gửi khóa trong chat hoặc commit vào GitHub.

Cách 1 — OpenRouter:

- `AI_PROVIDER`: `openrouter`
- `OPENROUTER_API_KEY`: khóa thật nhập riêng trong Vercel.
- `AI_MODEL`: `openai/gpt-4o-mini`, hoặc model được tài khoản OpenRouter của anh hỗ trợ.

Cách 2 — OpenAI:

- `AI_PROVIDER`: `openai`
- `OPENAI_API_KEY`: khóa thật nhập riêng trong Vercel.
- `AI_MODEL`: `gpt-4o-mini`, hoặc model được tài khoản OpenAI của anh hỗ trợ.

Thêm cho Production (và Preview nếu cần), rồi triển khai lại commit mới nhất. Nhãn chat chỉ đổi sang “Trợ lý AI” khi máy chủ báo có khóa. Điều này chưa chứng minh khóa có quyền gọi model: cần hỏi một câu ngoài FAQ để kiểm tra kết nối thật. Lỗi quota, khóa hoặc model sẽ quay về hướng dẫn FAQ/hotline. Khóa chỉ dùng phía máy chủ.

Mỗi yêu cầu giới hạn độ dài và số lượt ngữ cảnh, giới hạn token đầu ra, có timeout; rate limit trong bộ nhớ chỉ là biện pháp cơ bản theo từng instance. Đặt hạn mức chi tiêu/quota tại nhà cung cấp AI theo mức sử dụng mong muốn.

## Nhận yêu cầu tự động (tùy chọn)

Cấu hình `LEAD_WEBHOOK_URL` tới một HTTPS endpoint do anh quản lý có chức năng tiếp nhận/lưu thông tin; có thể cấu hình thêm `LEAD_WEBHOOK_TOKEN` nếu endpoint cần Bearer token. Không cấu hình endpoint chỉ để nhận phản hồi 200 mà không lưu dữ liệu.

Payload gồm loại yêu cầu `tenant`/`owner`, họ tên, số điện thoại, khu vực, loại BĐS, ngân sách, căn tham khảo/ngày muốn xem. Với chính chủ có thêm địa chỉ, diện tích, giá dự kiến, mô tả và xác nhận quyền cho thuê.

Chỉ gửi sau khi khách đồng ý liên hệ và bấm gửi. Máy chủ kiểm tra dữ liệu, đợi endpoint phản hồi thành công mới trả `{received:true}`. Lỗi kết nối không báo đã nhận mà cung cấp phương án gửi Zalo. Đây không phải CRM; cần kết nối một nơi tiếp nhận thật để có danh sách khách/nguồn ký gửi. Hạn chế truy cập dữ liệu khách tại nơi nhận theo nhu cầu vận hành.

## Chỉnh kiến thức và chạy thử

- Nội dung trả lời FAQ lấy từ khối FAQ trên trang. Khi sửa FAQ, chạy `python3 scripts/sync-chat-knowledge.py` để đồng bộ kiến thức AI phía máy chủ.
- Giao diện/luồng chat: `public/chatbot.js`, `public/chatbot.css`.
- API: `api/chat.mjs`, `api/leads.mjs`. Không cần cài thêm thư viện cho ứng dụng.
- Chạy local: `npm start`. Có thể dùng `node --env-file=.env.local server.mjs` với tệp cấu hình bí mật cục bộ đã được gitignore.
- Kiểm tra API: `node tests/chat-api.mjs` (mock nhà cung cấp, không dùng khóa thật hoặc gửi dữ liệu ra ngoài).
- Kiểm tra UI: chạy server ở cổng 3002 (`PORT=3002 npm start`), rồi `node tests/chat-ui.cjs` (cần Playwright và Chromium).
- Bản HTML đơn xuất bằng `python3 scripts/export-demo.py` dùng được FAQ và điền biểu mẫu, nhưng không có API máy chủ khi mở file ngoại tuyến.

## Giới hạn xác minh

Đã kiểm tra luồng UI/validation, trường hợp AI thành công/thất bại bằng mock và việc chuyển yêu cầu tới webhook được mock. Chưa kiểm tra AI hoặc webhook thật vì phiên thiết lập chưa có khóa hay endpoint được cấu hình. Tin BĐS vẫn là minh họa, không được bot trình bày như nguồn nhà đã xác minh.

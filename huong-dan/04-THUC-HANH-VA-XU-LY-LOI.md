# Bài tập nghiệm thu
1. Nhập bài: “Mặt bằng mẫu, T1 70m2, T2 90m2, giá 12tr/th”. Kiểm tra giá 12 triệu/tháng; tầng 1 là diện tích chính; tầng 2 được giữ trong mô tả. Không cộng nhầm hai lần giá lặp trong tiêu đề và nội dung.
2. Nhập kho 1.600m2, giá 110k/m2/tháng: tổng 176 triệu/tháng. Giữ rõ giá theo m² và tổng tháng. Không lấy tiền cọc, hoa hồng, phí chuyển nhượng làm tiền thuê.
3. Tạo khách giả, ngân sách 30 triệu, từ 40m², Cầu Giấy; ghi thêm Hà Đông trong yêu cầu. Xem gợi ý và kiểm tra lý do khớp, không coi tất cả gợi ý là khớp tuyệt đối.
4. Quản trị đăng trực tiếp; thành viên thường chờ duyệt; chỉ thành viên được chỉ định mới đăng tự động.
5. Mở cửa sổ ẩn danh: không thấy liên hệ nguồn, hoa hồng, map kín hoặc lịch sử ngày giờ. Đăng bằng thành viên khác: không thấy dữ liệu kín của người khác. Thử các đường API cũng phải bị chặn nếu chưa có quyền.
6. Kiểm tra HOT, hết hàng và chờ xác nhận; tin đã thuê không được gợi ý là còn hàng. Thử màn hình điện thoại, tìm kiếm và biểu mẫu.
7. Gửi nhu cầu giả, xác nhận lưu trong quản trị và Telegram nhận được. Nhập Docs một bài có ảnh, đối chiếu ảnh đúng tin; thử lại không tạo bản trùng ngoài mong đợi.

## Khi gặp lỗi
- npm không nhận: cài Node 24, đóng/mở lại Terminal.
- Thiếu thư viện: vào đúng thư mục chứa package.json, chạy npm ci.
- Cổng 3000 bận: dừng máy chủ cũ hoặc đổi PORT trong .env.
- Đăng nhập quản trị chưa kích hoạt: đã chạy npm run init chưa? ADMIN_SECRET có khớp .env và bản mã hóa đã triển khai không?
- Báo thiếu bảng: chạy đúng SQL trong dự án Supabase mới, không chỉ tạo biến môi trường.
- Telegram chat not found: kiểm tra token đúng bot, đã Start, chat.id đúng và Redeploy. Báo có cấu hình không đồng nghĩa đã gửi thành công.
- Google 403: bật đúng API, chia sẻ đúng file với client_email; kiểm tra tài khoản dịch vụ đang dùng. Không in private_key vào log.
- Google Docs chưa nhập: kiểm tra ID lệnh, ID Docs, Script properties, trigger, lịch sử chạy và thời gian chờ; bài thiếu dữ liệu có thể vào hàng kiểm tra.
- Đổi biến Vercel nhưng chưa có tác dụng: Redeploy rồi thử lại.

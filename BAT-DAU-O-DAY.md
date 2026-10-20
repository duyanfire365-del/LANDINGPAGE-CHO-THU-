# Bộ mẫu đào tạo website BĐS
Đây là bộ mã nguồn học tập được tách từ quy trình xây dựng website BĐS. Không phải bản sao dữ liệu kinh doanh. Có ba tin giả lập, ảnh hình khối mới và các kết nối để trống. `example.com`, `0000000000` là chỗ giữ chỗ, không dùng để giao dịch.

## Làm lần đầu
1. Giải nén, mở thư mục `website-bds-mau` trong Visual Studio Code.
2. Cài Node.js 24 LTS từ nodejs.org. Mở Terminal → New Terminal.
3. Gõ lần lượt, chờ mỗi lệnh chạy xong:
```
npm ci
npm run init
npm run check
npm start
```
4. Mở http://localhost:3000 để xem website; mở http://localhost:3000/admin để xem quản trị.
5. Mật khẩu mới nằm trong tệp `.credentials-local.txt` trên chính máy bạn. Mỗi lần cài mới có mật khẩu và khóa riêng. Không có mật khẩu dùng chung trong bộ mẫu.
6. Dừng máy chủ: nhấn Ctrl+C trong Terminal.

`npm run init` chỉ chạy lần đầu, không ghi đè `.env` hiện có. Chưa cấu hình Supabase thì xem được trang và danh sách mẫu; lưu khách, thành viên, tin mới và tích hợp cần các bước tiếp theo. Không nhập dữ liệu khách thật trong buổi học.

## Học theo thứ tự
- huong-dan/01-LO-TRINH-DAO-TAO.md: sơ đồ và giáo án.
- huong-dan/02-TRIEN-KHAI.md: Supabase, Vercel, tên miền.
- huong-dan/03-TELEGRAM-AI-GOOGLE.md: nhập bài và kết nối.
- huong-dan/04-THUC-HANH-VA-XU-LY-LOI.md: bài tập và kiểm tra.
- huong-dan/05-BAO-MAT-VA-PHAM-VI.md: dữ liệu đã loại, cách chia sẻ lại.

Các dịch vụ bên ngoài cần tài khoản/khóa của người học. Chưa kiểm thử với tài khoản dịch vụ mới của người học; thiết lập xong cần thử bằng dữ liệu giả trước khi sử dụng thực tế. Chi phí AI và giới hạn cron phụ thuộc nhà cung cấp/gói triển khai.

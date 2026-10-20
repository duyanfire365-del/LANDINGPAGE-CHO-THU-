# Đưa website lên mạng
## 1. Tạo kho dữ liệu Supabase riêng
1. Vào supabase.com, tạo New project, tự đặt mật khẩu cơ sở dữ liệu và lưu kín.
2. Mở SQL Editor → New query. Mở từng tệp dưới đây, copy toàn bộ, dán và bấm Run. Chạy theo thứ tự:
   - database/setup.sql
   - database/migrations/002-sale-transfer.sql
   - database/migrations/003-inquiry-management.sql
   - database/004_source_inbox.sql
   - database/005_source_automation.sql
   - database/006_property_sources.sql
   - database/007_customer_watch.sql
   - database/008_google_commands.sql
   - database/009_member_auto_publish.sql
3. Project Settings → API: lấy Project URL, anon key và service_role key. Chỉ nhập vào biến tương ứng trong .env hoặc Vercel; service_role phải ở máy chủ, không đưa vào public.
4. Authentication → URL Configuration: đặt Site URL và Redirect URLs bằng tên miền mới của bạn. Cấu hình xác nhận email theo nhu cầu.
5. Khởi động lại máy chủ sau khi đổi .env. Vào trang thành viên để tạo tài khoản thử.

## 2. Triển khai Vercel
1. Sau `npm run init`, tạo kho Git riêng tư của bạn, đưa mã nguồn vào. Không đưa .env hoặc .credentials-local.txt vào Git. Hai tệp lib/admin-password.json và lib/admin-listings.enc.json do init vừa tạo phải đi cùng bản triển khai của riêng bạn; không chia sẻ bản này làm bộ đào tạo công khai.
2. Vào vercel.com → Add New → Project → Import kho Git đó. Framework: Other; Output Directory: public. Giữ cấu hình vercel.json có sẵn.
3. Settings → Environment Variables: tạo ADMIN_SECRET với giá trị đã sinh trong .env. Phải khớp dữ liệu mã hóa; không tự đổi riêng khóa này. Thêm SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
4. SITE_URL là URL HTTPS thực của bạn. Thay các địa chỉ example.com trong giao diện và mã bằng tên miền của bạn; thay số 0000000000 bằng số kinh doanh được phép công khai. Thay hình giữ chỗ bằng hình bạn có quyền dùng. public/zalo-qr.png hiện là ảnh DEMO, không phải QR hoạt động.
5. Bấm Deploy. Khi thay biến môi trường: Deployments → Redeploy. Chờ Ready.
6. Settings → Domains: thêm tên miền mới, làm đúng bản ghi DNS Vercel yêu cầu. Không dùng tên miền hoặc tài khoản chủ bộ mẫu.
7. Kiểm tra trang chủ, /admin, /thanh-vien và một tin chi tiết. Thử lưu khách giả rồi kiểm tra dữ liệu trong quản trị.

## 3. Trang mẫu và lịch kiểm tra
Ba trang tin mẫu đã được dựng sẵn. Nếu sửa public/listings.json, chạy Python 3: `python scripts/build-listing-pages.py` để tạo lại trang và dữ liệu trình duyệt. Tin đăng qua hệ thống có luồng lưu riêng, không sửa JSON thủ công để thay dữ liệu trong Supabase.
Lịch cron có sẵn trong vercel.json: mỗi ngày 02:00 UTC (09:00 Việt Nam). Tạo CRON_SECRET ngẫu nhiên ít nhất 32 ký tự để xác thực. Kiểm tra giới hạn gói Vercel. Trạng thái chờ xác nhận sau 30 ngày và thứ tự HOT vẫn phải thử bằng tin mẫu trước khi áp dụng thật.

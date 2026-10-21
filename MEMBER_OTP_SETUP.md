# Chỉ đăng ký / đăng nhập bằng email

Website hiện chỉ dùng email. Không cần mua dịch vụ SMS, bật Phone provider hay chạy `database/010_phone_email_otp.sql`. Nếu đã chạy file SQL đó thì vẫn giữ nguyên được, không cần hoàn tác. Số điện thoại trên biểu mẫu là thông tin liên hệ không bắt buộc, không dùng để nhận OTP.

## 1. Mở Supabase

1. Vào https://supabase.com/dashboard và đăng nhập.
2. Chọn dự án đang kết nối với Nguonchothue.vn.
3. Bấm **Authentication** ở menu bên trái.

## 2. Bật xác minh email

1. Mở **Sign In / Providers** hoặc **Providers**, chọn **Email**.
2. Bật **Enable Email provider** và **Confirm email**.
3. Bấm **Save**. Không bật tự xác nhận email.

## 3. Đặt mẫu email có mã OTP

1. Trong Authentication, mở **Email Templates** hoặc **Emails → Templates**.
2. Chọn **Confirm signup**.
3. Điền tiêu đề: `Mã xác minh tài khoản Nguonchothue.vn`.
4. Dán nội dung dưới đây rồi bấm **Save**:

```html
<h2>Xác minh tài khoản Nguonchothue.vn</h2>
<p>Mã xác minh của anh/chị là:</p>
<h1>{{ .Token }}</h1>
<p>Hãy nhập mã này vào website để hoàn tất đăng ký.</p>
<p>Nếu không đăng ký, anh/chị có thể bỏ qua email này.</p>
```

5. Mở mẫu **Magic Link**, đặt tiêu đề `Mã đăng nhập Nguonchothue.vn`.
6. Dán nội dung dưới đây rồi bấm **Save**:

```html
<h2>Đăng nhập Nguonchothue.vn</h2>
<p>Mã đăng nhập của anh/chị là:</p>
<h1>{{ .Token }}</h1>
<p>Hãy nhập mã này vào website. Không cung cấp mã cho người khác.</p>
```

Giữ nguyên chính xác `{{ .Token }}`. Supabase sẽ thay nó bằng mã thật. Mẫu chỉ có link xác nhận không cung cấp mã để nhập trên website.

## 4. Kết nối dịch vụ gửi email

1. Tìm **SMTP Settings** trong Authentication / Emails.
2. Dùng thông tin SMTP từ dịch vụ gửi email của anh. Nếu chưa có, có thể đăng ký nhà cung cấp như Resend hoặc Brevo và xác minh tên miền theo hướng dẫn của họ.
3. Bật **Custom SMTP**, điền địa chỉ gửi thuộc tên miền đã xác minh, tên người gửi, Host, Port, Username và Password do nhà cung cấp cấp.
4. Bấm **Save**. Password ở đây là thông tin SMTP, không phải mật khẩu đăng nhập website.

Dịch vụ email mặc định của Supabase có giới hạn người nhận và số lần gửi; cần cấu hình phù hợp trước khi mở cho khách đăng ký. Không cần làm bất kỳ bước cấu hình SMS nào. Không gửi mật khẩu/khóa SMTP hay OTP vào chat; nhập trực tiếp tại Supabase.

## 5. Thử trên website

1. Chờ Vercel Ready, mở https://nguonchothue.vn/thanh-vien.
2. Bấm **Đăng ký thành viên**, nhập tên, email và mật khẩu ít nhất 12 ký tự; số điện thoại liên hệ có thể để trống.
3. Tích đồng ý và bấm **Tạo tài khoản**.
4. Kiểm tra email, cả thư mục Spam, lấy mã rồi nhập vào website.
5. Bấm **Xác nhận và đăng nhập**.
6. Đăng xuất, thử đăng nhập bằng email/mật khẩu hoặc **Nhận mã OTP để đăng nhập**.

Mã do Supabase tạo và kiểm tra; website không dùng mã cố định. Mã sai/hết hạn không tạo phiên đăng nhập. Gửi lại mã cần chờ ít nhất 60 giây trên giao diện; Supabase kiểm soát giới hạn gửi và xác minh ở máy chủ. Kiểm tra tự động trong repository dùng dịch vụ giả lập, chưa xác nhận email thật đã được gửi.

## 6. Cấp quyền thành viên

- Tài khoản mới không tự có quyền đăng tin, kể cả chọn Sale/CTV.
- Quản trị → Thành viên: cấp quyền gửi tin, chọn duyệt từng tin hoặc cho đăng tự động, rồi lưu.
- Nguồn / Map riêng: cấp quyền xem từng nguồn cho đúng tài khoản.
- Chỉ quản trị duyệt xóa/khôi phục; thành viên chỉ xóa được tin của chính mình.

Tắt lựa chọn điện thoại trên website không xóa tài khoản hoặc thông tin liên hệ đã có.

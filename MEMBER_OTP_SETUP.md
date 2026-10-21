# Đăng ký email / điện thoại và mã OTP

Code hỗ trợ đăng ký, xác minh OTP, gửi lại mã, đăng nhập bằng mật khẩu hoặc OTP qua email/SMS. OTP do Supabase Auth tạo, gửi và kiểm tra; website không lưu mã, không dùng mã cố định. Không tạo phiên đăng nhập khi mới đăng ký hoặc nhập sai mã.

## Cấu hình bắt buộc trước khi dùng thật

1. Trong Supabase SQL Editor, chạy `database/010_phone_email_otp.sql` một lần. Thay đổi này cho phép tạo hồ sơ không có email khi đăng ký bằng điện thoại; không thay đổi quyền đã cấp và không tự cấp quyền cho tài khoản mới.
2. Authentication → Providers / Sign In → Email: bật đăng ký Email và **Confirm email**. Tắt tự xác nhận email. Cấu hình SMTP gửi thư thực tế.
3. Authentication → Email Templates → Confirm signup: đặt mã `{{ .Token }}` trong nội dung thư, ví dụ **Mã xác minh của anh/chị: {{ .Token }}**. Template chỉ có link xác nhận sẽ không cung cấp mã để nhập trên website. Chỉnh cả template **Magic Link** chứa `{{ .Token }}` để dùng nút đăng nhập bằng OTP.
4. Authentication → Providers / Sign In → Phone: bật điện thoại và xác minh số điện thoại, cấu hình nhà cung cấp SMS được Supabase hỗ trợ và thông tin gửi SMS tới số Việt Nam. Tắt tự xác nhận số điện thoại; không dùng số/mã thử nghiệm cho khách thật. Mẫu SMS cần có `{{ .Code }}`.
5. Kiểm tra giới hạn gửi và thời hạn OTP trong Supabase Auth. Website có chờ gửi lại 60 giây và giới hạn yêu cầu API; Supabase kiểm soát gửi mã, xác minh và mã hết hạn ở phía máy chủ.
6. Chờ Vercel Ready, vào `/thanh-vien`, thử đăng ký bằng email thật và điện thoại thật, kiểm tra nhận mã, mã sai, xác minh thành công rồi đăng xuất/đăng nhập lại. Việc kiểm tra tự động trong repository dùng dịch vụ giả lập, không xác nhận email/SMS thật đã gửi.

Nếu chưa cấu hình dịch vụ email/SMS hoặc chưa chạy SQL, website báo lỗi gửi/đăng ký, không thông báo giả rằng đã xác minh. Không gửi khóa SMS/SMTP, mật khẩu hoặc OTP vào chat hỗ trợ; nhập chúng tại Supabase.

## Quyền thành viên

Tài khoản mới mặc định không có quyền đăng bài. Lựa chọn Sale/CTV khi đăng ký không tự cấp quyền.

- Quản trị → Thành viên: cấp/thu hồi quyền gửi tin; sau khi cấp có thể cho đăng tự động hoặc yêu cầu duyệt từng tin.
- Nguồn / Map riêng: quản trị hoặc người quản lý nguồn cấp quyền xem từng nguồn cho đúng thành viên.
- Chỉ quản trị viên duyệt xóa/khôi phục tin và quản lý các tài khoản khác. Thành viên được xóa tin thuộc chính tài khoản mình, tin sẽ ẩn và vào danh sách quản trị duyệt.

Dữ liệu quyền do máy chủ kiểm tra; gửi các trường can_post, auto_publish, admin từ biểu mẫu không được cấp quyền.

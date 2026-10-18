# Kết nối nguonchothue.vn

Đã chuẩn bị canonical, metadata ảnh chia sẻ và sitemap cho `https://nguonchothue.vn`. Việc thêm tên miền vào tài khoản Vercel và thay đổi DNS cần chủ tài khoản thực hiện; thay đổi mã nguồn không tự kết nối DNS.

1. Mở https://vercel.com/duy-tran3/webchothue/settings/domains → **Add Domain** → nhập `nguonchothue.vn`, gắn với Production.
2. Thêm `www.nguonchothue.vn` và chọn chuyển hướng về `nguonchothue.vn` nếu muốn dùng cả hai cách gõ.
3. Trong Mắt Bão, mở quản lý DNS của tên miền. Sao chép chính xác bản ghi **A/CNAME** (và **TXT** xác minh nếu được yêu cầu) từ trang Domains của Vercel. Không dùng IP hoặc CNAME lấy từ hướng dẫn cũ vì Vercel có thể cấp giá trị khác theo dự án. Nếu DNS đang do nhà cung cấp khác quản lý thì thay đổi tại nhà cung cấp đó.
4. Chỉ thay các bản ghi web tương ứng `@` và `www`; giữ các bản ghi email MX, SPF, DKIM hiện có. Không cần đổi nameserver nếu đang quản lý DNS trực tiếp tại Mắt Bão.
5. Đợi Vercel báo **Valid Configuration** và chứng chỉ HTTPS sẵn sàng. Chỉ bật chuyển hướng tên miền vercel.app sang tên miền mới sau khi cả web và HTTPS đã được kiểm tra.
6. Vercel → Environment Variables: đặt `SITE_URL=https://nguonchothue.vn` cho Production, rồi Redeploy để cập nhật trang tin mới phía máy chủ.
7. Nếu đã dùng Supabase Auth: đổi Site URL sang `https://nguonchothue.vn` và thêm tên miền mới vào Redirect URLs. Phiên đăng nhập trên vercel.app không chuyển sang .vn; đăng nhập lại trên tên miền mới.

Kiểm tra: trang chủ, một trang tin `/bds/hn-001`, `/admin`, `/thanh-vien`, gửi biểu mẫu và đường dẫn chia sẻ. Bản vercel.app được giữ hoạt động trong lúc DNS chưa hoàn tất.

Phiên thực hiện chưa xác minh được DNS/HTTPS công khai do môi trường chặn kết nối kiểm tra; chưa có xác nhận thêm domain vào Vercel hay thay đổi DNS.

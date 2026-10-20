# Giáo án thực hành
## Bản đồ hệ thống
Khách truy cập → public (giao diện) → api (xử lý máy chủ) → Supabase (lưu trữ).
Telegram / Google Docs / Sheets → API nhập liệu → chuẩn hóa → duyệt/đăng → gợi ý nguồn phù hợp → thông báo.

| Thư mục | Vai trò |
|---|---|
| public | Trang chủ, đăng tin, quản trị, tìm kiếm, biểu mẫu |
| api | Xác thực, khách quan tâm, tin đăng, tệp, bot, cổng Google |
| lib | Tách giá/diện tích, so khớp, quyền truy cập, AI, đóng dấu |
| database | Cấu trúc bảng và chính sách truy cập |
| integrations | Apps Script để Docs gửi lệnh về website |
| scripts | Kiểm tra, tạo khóa và tạo trang tin mẫu |

## Buổi 1 — Dựng website (60–90 phút)
Giải nén → cài Node → chạy bốn lệnh ở BAT-DAU-O-DAY.md → xem ba tin minh họa. Sửa tên thương hiệu, màu sắc trong public/styles.css; tìm `example.com` và số giữ chỗ để hiểu nơi cấu hình. Không thay URL nhà cung cấp API bằng tên miền website.

## Buổi 2 — Dữ liệu và phân quyền (90 phút)
Tạo Supabase riêng, chạy SQL, đăng ký một thành viên giả. Đăng bằng quản trị để duyệt. Kiểm tra khách ẩn danh không thấy nguồn, hoa hồng, map riêng, ngày giờ đăng. Thành viên chỉ xem dữ liệu được cấp quyền. Chỉ gán đăng tự động cho tài khoản đã lựa chọn.

## Buổi 3 — Nhập tin và khách (90 phút)
Dán bài gốc, chuẩn hóa giá/diện tích, xem bản công khai và dữ liệu kín. Tạo khách theo dõi giả, bấm gợi ý nguồn; so sánh tiêu chí giá/khu vực/diện tích. Thử trạng thái còn hàng, chờ xác nhận, đã thuê và HOT.

## Buổi 4 — Tự động hóa (90–120 phút)
Kết nối bot thông báo, bot nguồn riêng; sau đó Google Sheets và Google Docs. Thử nhập một tin trước khi nhập cả tập tài liệu. Phân biệt dữ liệu đủ để tự đăng với dữ liệu thiếu phải kiểm tra; không đoán giá hoặc địa chỉ còn thiếu.

## Quy trình dạy lại
Mỗi người nhận một bản ZIP nguyên gốc → tự tạo dự án và khóa → dùng dữ liệu giả → kiểm tra phân quyền → mới chuyển sang dữ liệu được phép sử dụng. Không chia sẻ thư mục làm việc sau khi đã nhập khóa và khách thật.

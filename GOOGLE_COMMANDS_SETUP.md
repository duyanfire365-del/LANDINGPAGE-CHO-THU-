# Cổng lệnh Google Docs / Google Sheets

## Bật lần đầu — làm từng bước
1. Nếu chưa chạy SQL 007, làm [hướng dẫn kho khách](CUSTOMER_WATCH_SETUP.md) trước.
2. Mở file [008_google_commands.sql](https://github.com/duyanfire365-del/LANDINGPAGE-CHO-THU-/blob/main/database/008_google_commands.sql) → bấm Copy.
3. Supabase → dự án website → SQL Editor → New query → dán → Run. Thấy `Success. No rows returned` là thành công.
4. Dùng chính tài khoản dịch vụ Google ở hướng dẫn kho khách. Không cần tạo bot hoặc khóa Google mới nếu đã có GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON.
5. Vào https://console.cloud.google.com → đúng Project → APIs & Services → Library. Bật **Google Sheets API** và **Google Docs API**.
6. Tạo sẵn Google Sheet hoặc Google Doc trong tài khoản Google của anh.
7. Mở file JSON tài khoản dịch vụ, tìm `client_email`. Trong Google Doc/Sheet, bấm Share → thêm email đó → Editor. Giữ General access là Restricted.
8. Vercel → Settings → Environment Variables → Production: kiểm tra đã có GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON = toàn bộ nội dung JSON tài khoản dịch vụ. Giữ kín, không gửi vào chat.
9. Redeploy bản Production mới nhất, chờ Ready.
10. Website → đăng nhập quản trị → Khách hàng / Công cụ → **Cổng Google Docs / Sheets**.

Cổng dùng tài liệu có sẵn do anh tạo, không tự tạo tệp Drive dưới tên tài khoản dịch vụ. GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON dùng chung với chức năng đồng bộ khách trước đây; CUSTOMER_GOOGLE_SHEET_ID chỉ dùng cho bảng đồng bộ khách cũ, cổng lệnh mới nhận link từng tệp ngay trong giao diện.

## Ví dụ dễ nhất: nhập khách từ Google Sheets
1. Tạo Sheet riêng. Dòng đầu nhập các tên cột:
   `Tên | SĐT | Khu vực | Loại BĐS | Ngành nghề | Ngân sách tối đa | Diện tích tối thiểu | Nhu cầu | Ghi chú`.
2. Mỗi dòng tiếp theo là một khách. Đặt cột SĐT là Plain text để giữ số 0 đầu. Ngân sách tính bằng triệu/tháng, diện tích m²; dùng số thuần, ví dụ 30 và 80.
3. Chia sẻ Sheet cho client_email như trên rồi sao chép link.
4. Trong cổng, chọn Google Sheets → Nhập từ Google lên website → Khách theo dõi riêng.
5. Dán link. Tên trang tính có thể để trống để đọc trang đầu; hoặc gõ đúng tên tab chứa khách.
6. Bấm **Đọc và xem trước**. Chưa lưu khách vào website ở bước này.
7. Kiểm tra tên, SĐT, khu vực; dòng chưa hiểu được hiện lỗi.
8. Bấm **Nhập các dòng hợp lệ**. Khách được quản trị quản lý kín và đối chiếu nguồn.

Có thể thêm cột Địa chỉ, Năm sinh, Ngày liên hệ, Hẹn chăm sóc, Nguồn khách. Ngày dùng YYYY-MM-DD. Mỗi lần tối đa 50 dòng. Không nhập một số điện thoại vào nhiều người mà không ghi rõ.

## Nhập tin BĐS từ Sheets
Dòng đầu dùng các cột:
`Tiêu đề công khai | Tên đường công khai | Khu vực | Danh mục | Giá thuê (triệu/tháng) | Đơn giá (đồng/m²/tháng) | Diện tích | Mô tả công khai | Địa chỉ riêng tư | Hashtag`.

Ví dụ:
- Tiêu đề công khai: Văn phòng tại Cầu Giấy.
- Tên đường công khai: Vũ Phạm Hàm.
- Khu vực: Cầu Giấy.
- Danh mục: Văn phòng.
- Giá thuê: 20.
- Diện tích: 80.
- Mô tả công khai: Không gian văn phòng, liên hệ để xem thực tế.
- Địa chỉ riêng tư: nhập số nhà/ngõ đầy đủ ở cột này.

Nếu có đơn giá/m²: điền cột Đơn giá bằng đồng/m²/tháng, ví dụ 58000; website tính tổng tiền tháng từ diện tích. Cột giá tháng không được dùng để nhập giá bán/chuyển nhượng.

Các cột riêng tùy chọn: SĐT chủ nhà 1/2/3, SĐT đối tác 1/2/3, Tên nguồn, Hoa hồng, Vị trí Map. Cột Mã ảnh asset chỉ nhận ID ảnh/video đã tải lên kho website, phân cách bằng dấu phẩy; không tự tải ảnh từ link bất kỳ.

Chọn dữ liệu Tin BĐS rồi xem trước. Mặc định tin vào chờ duyệt. Chỉ tích **tự đăng công khai** nếu anh muốn những dòng hợp lệ được đăng ngay. Dòng chứa địa chỉ đầy đủ, số nguồn, hashtag hay hoa hồng trong phần công khai sẽ bị chặn và báo lỗi; không chuyển bừa sang tin công khai.

## Nhập từ Google Docs
- Chọn Google Docs, dán link Doc đã chia sẻ cho tài khoản dịch vụ.
- Dễ nhất dùng tên trường giống các cột mẫu ở trên, mỗi trường một dòng, viết `Tên trường: nội dung`.
- Ngăn các khách hoặc BĐS bằng một dòng `---`.
- Khách cũng có thể dùng mẫu Tên/SĐT/Khu vực/Nhu cầu trong hướng dẫn bot khách.
- Với bài nguồn BĐS tự do, phải có giá thuê, diện tích và nhận diện được từng BĐS. Hệ thống dùng quy tắc đọc tin hiện có, không tự thực hiện chỉ thị nằm trong tài liệu.
- Ảnh chèn trực tiếp cùng bài được tải vào kho website và ghép vào đúng tin. Chọn ảnh → Trong dòng văn bản (In line) để thứ tự rõ ràng. Đặt ảnh trước dòng `---` kết thúc bài; ảnh sau dòng đó thuộc bài tiếp theo.
- Tối đa 12 ảnh/tin, 24 ảnh/tài liệu/lượt. Chỉ đọc chữ thật trong Docs, không OCR nội dung chữ nằm trong ảnh.
- Muốn dán chữ + ảnh rồi tự đăng theo lịch 5 phút: làm [hướng dẫn tự đăng từ Docs](GOOGLE_DOCS_AUTO_POST_SETUP.md). Tích chờ ảnh để không đăng lúc chỉ mới dán chữ.
- Mỗi lần tối đa 60.000 ký tự, 50 hồ sơ. Nội dung chưa tách rõ giữ trong lỗi xem trước; anh sửa tài liệu rồi đọc lại.

## Xuất từ website sang Google
1. Tạo Doc hoặc Sheet đích, chia sẻ cho client_email quyền Editor.
2. Chọn **Xuất website sang Google**, chọn Tin BĐS hoặc Khách theo dõi riêng, dán link đích.
3. Bấm Đọc và xem trước → kiểm tra → Thực hiện xuất sang Google.
4. Xuất Sheet: tạo tab mới có tên Website_posts_... hoặc Website_customers_... cho lượt đó. Không ghi vào tab nhập của anh hoặc ba tab đồng bộ khách cũ.
5. Xuất Docs: nối thêm một mục có ngày giờ và mã lượt, không xóa văn bản đã có. Không sửa Doc đồng thời khi đang chạy lệnh để tránh xung đột phiên bản.
6. Tin BĐS mặc định chỉ xuất dữ liệu công khai. Muốn có địa chỉ đầy đủ, số nguồn, hoa hồng, Map riêng phải tích Xuất kèm thông tin riêng.
7. Xuất khách luôn chứa thông tin riêng. Người xem tệp Google có thể xem dữ liệu đã xuất; chỉ dùng tệp riêng, không bật công khai.

Một lượt xuất tối đa 5.000 hồ sơ. Nội dung nhập được ghi vào Sheets bằng RAW, không chạy công thức do người dùng nhập. Docs xuất quá dài sẽ báo dùng Sheets.

## Lưu lệnh để dùng lại hoặc tự chạy
- Nhập tên dễ nhớ, ví dụ “Nhập khách từ Sheet của anh”, chọn đúng cấu hình rồi bấm Lưu lệnh.
- Chọn Sửa lệnh để đổi link, loại dữ liệu, bật/tắt lịch; bấm Lưu lại.
- Trong danh sách, bấm Đọc và xem trước để dùng lại lệnh.
- Mặc định chỉ chạy khi anh bấm. Muốn tự chạy: chọn Mỗi ngày và tích Bật lệnh tự động rồi Lưu.
- Lịch dùng cron Vercel hiện có, cần CRON_SECRET và triển khai Ready. Hiện cron chạy 02:00 UTC, tương đương **09:00 giờ Việt Nam mỗi ngày**; không phải đồng bộ ngay khi sửa Google.
- Mỗi lượt cron xét tối đa 10 lệnh bật hằng ngày. Mỗi lệnh chỉ tạo một lượt tự động trong một ngày; lỗi được lưu để kiểm tra, không tự lặp ghi dữ liệu Google vô hạn.
- Lượt tự động có dòng lỗi sẽ dừng để anh kiểm tra tài liệu. Sửa xong rồi tạo bản xem trước mới để thực hiện.
- Có lịch sử 20 lượt gần nhất: trạng thái, lỗi, kết quả và link Google đích. Nếu bị gián đoạn, kiểm tra lịch sử và tài liệu trước khi tạo lượt xuất mới.

## Chống trùng và phạm vi đồng bộ
Nhập là thêm dữ liệu, không ghi đè hồ sơ/tin cũ. Khách trùng SĐT trong kho quản trị hoặc trùng Mã khách đã xuất sẽ bỏ qua. Tin trùng mã, khóa nhập hoặc địa chỉ/diện tích nhận diện được sẽ bỏ qua. Giá thay đổi nên sửa hồ sơ/tin cũ trong website; cổng này chưa đồng bộ sửa/xóa hai chiều tự động.

Khách nhập qua cổng Google do quản trị quản lý; cổng không mở cho thành viên và không cấp quyền từ nội dung tệp. Chức năng Google Sheet tự đồng bộ khách đã có trước đây vẫn hoạt động riêng, không cần thay bot nguồn hay bot khách.

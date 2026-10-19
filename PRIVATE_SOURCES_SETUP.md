# Thông tin nguồn và Map riêng

## Kích hoạt một lần

1. Mở file `database/006_property_sources.sql` trên GitHub, sao chép toàn bộ nội dung.
2. Mở đúng dự án Supabase của website → SQL Editor → New query.
3. Dán nội dung rồi bấm Run. Bảng chỉ cho máy chủ truy cập; khách và khóa anon/authenticated không đọc trực tiếp được.
4. Chờ deployment mới trên Vercel Ready, tải lại trang quản trị. Không cần thêm khóa API hoặc biến môi trường.

Thông tin từ bài gửi mới vẫn được lưu trong `posts.private_data.sourceInfo` ngay cả khi chưa chạy SQL. Bảng mới lưu phần quản lý/sửa bổ sung, quyền chia sẻ và link Map; cần chạy SQL để dùng các thao tác này. Tin Telegram cũ có `private_data.sourceText` được nhận diện nguồn khi mở quản lý. Không suy đoán số chủ nhà cho bài cũ không có dữ liệu.

## Gửi từ Telegram

Thêm các dòng sau vào nội dung/chú thích ảnh; mỗi dòng là dữ liệu, không phải lệnh cấp quyền:

```
Chủ nhà 1: 0911111111
Chủ nhà 2: 0922222222
Chủ nhà 3: 0933333333
Đối tác 1: 0944444444
Đối tác 2: 0955555555
Đối tác 3: 0966666666
Nguồn của: Anh Hùng
Map: https://maps.app.goo.gl/MA_MAP_CUA_ANH
```

Thay số điện thoại và link ví dụ bằng dữ liệu thật. Các nhãn CN1/CN2/CN3, C1/C2/C3, Nguồn 1/2/3, SĐT chủ nhà, Số điện thoại chủ nhà cũng được nhận diện. Có thể ghi tọa độ hoặc địa chỉ cụ thể sau `Map:`. Mặc định không công khai bất kỳ số nguồn, tên nguồn hoặc Map nào. Không cần trả phí AI để tách các dòng này.

Biểu mẫu đăng tin có sáu ô điện thoại, tên nguồn và Map. Nhập Excel dùng các cột tương ứng trong mẫu mới; nhập tài liệu văn bản có nhãn được tách vào phần riêng tư. Tài liệu nhiều tin qua AI cần xem lại từng bản nháp để tránh gán nhầm nguồn.

## Quyền xem/sửa

- Quản trị viên: xem và quản lý tất cả tin, kể cả 30 nguồn tĩnh ban đầu.
- Người đăng: xem nguồn tin của mình. Sale/CTV đang được cấp quyền gửi tin có thể sửa nguồn, mở/ẩn từng số điện thoại/tên nguồn, cấp/thu hồi quyền xem theo email.
- Thành viên được chia sẻ: xem nguồn và Map, không sửa, không tạo/thu hồi link.
- Khách: chỉ nhận số điện thoại/tên nguồn đã được chủ động tích công khai. Map không có chế độ công khai.

Vào Admin → Nguồn BĐS riêng hoặc Tin trên website → mở dòng tin → Nguồn / Map riêng. Thành viên vào Tin của anh/chị hoặc Nguồn được cấp quyền xem. Tin trên trang khách chỉ hiện nút Map riêng khi tài khoản có quyền. Bỏ email và lưu để thu hồi quyền thành viên.

## Chia sẻ Map riêng cho khách

Mở Nguồn / Map riêng, nhập Map rồi chọn Lưu và tạo link Map riêng. Hạn dùng 24 giờ, 3 ngày hoặc 7 ngày. Liên kết chỉ chứa quyền mở Map, không hiển thị số chủ nhà/đối tác, không đưa vào danh mục công khai, có noindex/no-store/no-referrer. Quản trị viên hoặc chủ tin có thể thu hồi tất cả link của tin. Người nhận có thể lưu hoặc chuyển tiếp vị trí; thu hồi không xóa được thông tin họ đã lưu ngoài website.

Mỗi tin giữ tối đa 5 link còn hạn. Dữ liệu nguồn không được đưa vào catalog, HTML chia sẻ, bài sao chép hoặc danh sách công khai khi chưa cho phép. Xuất dữ liệu quản trị có cột nguồn/điện thoại/Map, cần giữ riêng các tệp xuất.

## Kiểm thử

`tests/property-source.mjs` kiểm tra trích xuất, mặc định riêng tư, số điện thoại và URL Map. `tests/platform.mjs` dùng Supabase/Telegram giả lập để kiểm tra quyền, mở/ẩn từng số, cấp/thu hồi quyền thành viên, token giả/hết hạn/thu hồi, UI quản trị/thành viên và trang khách. `tests/source-automation.mjs` xác nhận thông tin nguồn đi từ Telegram vào private_data mà không lộ ra public_data. Không gửi tin thật, không gọi AI trả phí trong kiểm thử.

## Hoa hồng riêng tư

Nguồn mới tự nhận các dạng HH50%, H50%, Hoa hồng: 1 tháng tiền thuê, HH: 10 triệu. Giữ nguyên thỏa thuận, không tự đoán 50% là của giá trị nào. Hoa hồng chỉ cho quản trị viên và chủ bài xem; thành viên chỉ được cấp quyền xem nguồn/Map không thấy hoa hồng. Không có chế độ công khai hoa hồng. Mẫu Excel có cột Hoa hồng (riêng tư); xuất quản trị cũng có cột này. Dùng bảng 006 đã có, không cần SQL bổ sung.

## Chia sẻ Facebook/Zalo

Nút Facebook/Zalo mở bảng chuẩn bị bài và tối đa 12 ảnh của tin. Thiết bị hỗ trợ Web Share có thể gửi bài và nhiều ảnh sang ứng dụng; ứng dụng nhận có thể bỏ qua phần chữ hoặc chỉ nhận liên kết. Máy tính có nút sao chép bài, sao chép ảnh PNG và tải từng ảnh. Mở Facebook để đăng bài dẫn tới Facebook; nút Chia sẻ liên kết Facebook dùng hộp chia sẻ liên kết/ảnh xem trước riêng. Facebook không cho website tự điền nội dung tùy ý và tự tải ảnh vào bài cá nhân/nhóm qua nút share; người dùng chọn nơi đăng và xác nhận. Hoa hồng bị loại khỏi bài chia sẻ, kể cả khi có trong caption cũ.

### Kiểm soát người được chia sẻ
Trong Nguồn BĐS và Map riêng, tìm thành viên theo họ tên, số điện thoại hoặc email đã đăng ký, bấm tên để chọn. Ghi năm sinh, địa chỉ và mục đích chia sẻ cho từng người, rồi bấm Lưu thông tin nguồn. Bỏ quyền xem rồi lưu để thu hồi. Loại Khách hàng/Sale lấy từ tài khoản; các ghi chú là thông tin người quản lý ghi nhận, chưa xác minh danh tính. Chỉ người có quyền quản lý nguồn xem danh sách và ghi chú, người được chia sẻ không xem được. Dữ liệu nằm trong bảng property_sources hiện có, không cần chạy SQL mới nếu đã chạy 006.

### Form nhu cầu và gợi ý tự động
Trang chủ → Cần thuê: chọn khu vực, loại BĐS, ngành nghề, khoảng ngân sách hoặc ngân sách tối đa, diện tích tối thiểu và yêu cầu thêm. Bấm Xem BĐS gợi ý để đối chiếu các tin công khai đang còn hàng; không cần gửi thông tin liên hệ để xem. Gợi ý nêu điểm đáp ứng và tiêu chí cần trao đổi, ngành nghề cần được xác nhận pháp lý/hiện trạng trước khi thuê. Yêu cầu thêm được chuyển cho tư vấn viên, không tự coi là tính năng đã được xác minh của BĐS.

Khi khách đồng ý liên hệ và bấm Gửi nhu cầu cần thuê, hồ sơ cùng tiêu chí được lưu vào inquiries.owner_notes và xuất trong các báo cáo hiện có; Telegram nhận tóm tắt qua TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID hiện tại. Telegram lỗi thì hồ sơ vẫn lưu, notification_log ghi nhận để quản trị gửi lại. Không cần SQL mới. Đây là đối chiếu và xếp hạng tiêu chí tự động bằng dữ liệu website, không gọi AI trả phí và không hứa xác nhận ngành nghề khi tin không có thông tin.

Phần Yêu cầu mong muốn thêm nhận diện thêm khu vực từ văn bản (30 quận/huyện cũ và các tên quen thuộc đã khai báo như Mỹ Đình → Nam Từ Liêm). “Hà Đông cũng được” mở rộng lựa chọn; “chỉ tìm Hà Đông” thay lựa chọn; “không ở Hà Đông” loại trừ. Giao diện hiện khu vực đang hiểu để khách kiểm tra. Đây là nhận diện bằng quy tắc, không khẳng định hiểu mọi tên địa điểm/lỗi chính tả hoặc mọi điều kiện tự do. Tin ngoài khu vực có thể xuất hiện như gợi ý gần tiêu chí và được ghi rõ Khác khu vực. Chỉ gửi lời cảm ơn sau khi API xác nhận đã nhận hồ sơ; thời gian 1–3 phút là dự kiến, kết quả lọc xong sẽ hiện ngay trong trang, không tự gửi kết quả qua Zalo/SMS.

Chat tư vấn hỗ trợ chọn loại BĐS, khu vực, ngân sách, ngành nghề và diện tích; có lối tắt điền form ở từng bước. Nhận diện nhu cầu gõ tự do bằng các quy tắc thông dụng, giữ nguyên nội dung vào Yêu cầu mong muốn thêm để bộ lọc xử lý các khu vực bổ sung. Xem nguồn gợi ý / Điền nhu cầu sẽ chuyển các tiêu chí sang form và tự chạy lọc, không tự gửi hồ sơ hoặc số điện thoại. Không xác nhận ngành nghề hay điều kiện thuê khi chưa có dữ liệu. Chỉ khi khách điền thông tin, đồng ý liên hệ và bấm gửi mới lưu hồ sơ/báo Telegram như luồng hiện có.

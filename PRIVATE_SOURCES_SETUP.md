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

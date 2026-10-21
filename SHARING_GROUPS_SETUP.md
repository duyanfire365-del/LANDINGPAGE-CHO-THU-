# Chia sẻ nhanh bài và ảnh tới nhiều nhóm

Tính năng giúp chọn nhiều nơi, sao chép nội dung, tải ảnh và mở các nhóm để anh đăng thủ công. Website không tự đăng lên nhóm Facebook/Zalo bằng tài khoản cá nhân và không tự xác nhận đăng thành công.

## Lần đầu thêm nhóm

1. Chờ Vercel báo Ready cho bản mới, tải lại website bằng Ctrl + F5.
2. Đăng nhập quản trị trên chính tên miền đang xem bài.
3. Mở một tin → bấm **Facebook · Bài & ảnh** hoặc **Zalo**.
4. Mở **Thêm / sửa danh sách nhóm của anh**.
5. Điền tên dễ nhớ, chọn Facebook/Zalo, dán link nhóm → **Lưu nhóm**.
6. Có nhiều nhóm: mở **Dán nhiều link nhóm một lần**, mỗi dòng ghi `Tên nhóm | Link nhóm`, rồi bấm thêm. Facebook dùng link trang nhóm /groups/… hoặc link nhóm /share/g/…; Zalo dùng link mời /g/…. Không dùng link bài viết hoặc số điện thoại làm link nhóm.

Danh sách nhóm được lưu riêng trên máy chủ cho quản trị, dùng lại trên thiết bị khác sau khi đăng nhập. Thành viên và khách không xem/sửa được danh sách; không lưu link mời nhóm trong localStorage hoặc nội dung bài công khai. Tối đa 60 nhóm, có nút sửa, bỏ nhóm và tải lại. Không cần nhập mật khẩu Facebook/Zalo hay cài SQL mới. Nếu có hai nơi sửa cùng lúc, bản cũ bị từ chối ghi đè và yêu cầu tải lại.

## Mỗi lần chia sẻ

1. Chọn nền tảng, tích các nhóm cần đăng.
2. Bấm **Sao chép bài & link**. Nội dung đã kèm link BĐS, https://nguonchothue.vn/ và lời mời theo dõi/lưu website, đăng ký hỗ trợ nhanh tại https://nguonchothue.vn/#tu-van. Ghi chú giá dự kiến/hoa hồng nội bộ bị loại khỏi bản chia sẻ.
3. Bấm **Tải bộ ảnh & bài** nếu cần ảnh trên máy tính. Giải nén ZIP để chọn các ảnh; file BAI-DANG-VA-LINK.txt chứa cùng nội dung và lời mời.
4. Bấm **Mở các nhóm đã chọn** để mở tối đa 10 nơi/lượt, hoặc **Mở nhóm tiếp theo**. Trình duyệt có thể chặn nhiều tab: dùng link Mở nhóm từng dòng hoặc cho phép cửa sổ bật lên của website.
5. Trong mỗi nhóm, dán bài, chọn ảnh và bấm Đăng. Anh cần đăng nhập và có quyền đăng trong nhóm; nhóm có thể vẫn yêu cầu duyệt.
6. Quay lại website, tự tích **Tôi đã đăng** để theo dõi. “Đã yêu cầu mở” không có nghĩa đã đăng; website không đọc được kết quả trong Facebook/Zalo. Tiến độ này chỉ giữ trong phiên trang, xóa khi đăng xuất/tải lại.

Trang cá nhân Facebook có lối mở sẵn. Nhật ký Zalo cần dùng **Chia sẻ qua ứng dụng/Chia sẻ bài & ảnh** trên điện thoại và chọn Nhật ký nếu ứng dụng hỗ trợ. Mở chat.zalo.me không tự tạo bài Nhật ký. Một số ứng dụng nhận ảnh nhưng bỏ phần chữ; dán nội dung đã sao chép nếu cần. Chia sẻ liên kết Facebook chỉ gửi link, không tự đính ảnh từ website.

## Chuẩn bị nhiều bài

- Mở **Hàng chờ chia sẻ nhiều bài** → thêm bài đang xem, hoặc tìm và tích nhiều bài đã đăng → **Thêm các bài đã tích**.
- Tối đa 20 bài mỗi phiên. **Bài tiếp theo** mở bộ bài/ảnh của tin kế tiếp, giữ nhóm đã chọn và tiến độ riêng cho từng tin; không gộp ảnh các BĐS khác nhau.
- Có nút tải toàn bộ nội dung hàng chờ dạng TXT, mỗi bài có link và lời mời riêng. Ảnh tải theo từng bài bằng ZIP để tránh lẫn nguồn.
- Hàng chờ và dấu đã mở/đã đăng chỉ giữ trong phiên trang; danh sách nhóm đã lưu vẫn còn sau khi đăng nhập lại. Không đánh dấu bài đăng xong chỉ vì đã tải ảnh hoặc mở tab.

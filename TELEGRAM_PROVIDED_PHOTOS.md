# Tự đăng bằng quy tắc và ảnh gửi kèm

Luồng Telegram hiện cố định không dùng API AI, không giới hạn 20 tin/ngày. Hướng dẫn hiện hành: [TELEGRAM_AUTO_PUBLISH.md](TELEGRAM_AUTO_PUBLISH.md).

Có thể gửi bài tự do, không bắt buộc đúng mẫu. Ví dụ:

```text
Cho thuê văn phòng
Địa chỉ: Số 12 đường Phố Mẫu, Cầu Giấy, Hà Nội
DT: 100m2; MT: 6m
Giá thuê: 20tr/tháng
Thông tin nội bộ:
Nguồn: Đối tác Mẫu
Phí môi giới: Thỏa thuận
```

Gửi một bài kèm tối đa 12 ảnh JPEG/PNG/WebP, mỗi ảnh tối đa 10 MB. Nếu gửi nhiều ảnh, dùng album với một chú thích. Không có ảnh vẫn đăng bằng ảnh minh họa có sẵn hoặc đồ họa nội bộ.

Ảnh không tự được AI kiểm tra: bot giữ riêng và hỏi chọn công khai/riêng. Anh có thể ghi rõ yêu cầu công khai hoặc giữ riêng ngay trong bài. Reply bài gốc để bổ sung hoặc thay ảnh; ảnh rời không có liên kết không tự gắn vào bài bất kỳ.

Bài được lưu trước khi xử lý. Có thể mở Admin → Nguồn từ bot Telegram → Tải nguồn mới để xem trạng thái hoặc thử lại; không cần gửi lặp nhiều lần.

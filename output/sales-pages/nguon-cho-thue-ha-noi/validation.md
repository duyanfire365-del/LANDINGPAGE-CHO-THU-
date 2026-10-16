# Xác minh bản marketing

- npm run check: đạt.
- Playwright trên server: đạt bộ lọc, trạng thái không có kết quả, yêu thích giữ qua reload, hộp chi tiết, chọn căn cho form, kiểm tra form, số điện thoại, ảnh SVG, không có lỗi JavaScript.
- Kích thước 375, 768, 1024, 1440px: không tràn ngang.
- Bản HTML đơn: cùng bộ kiểm thử đạt qua route HTTP phục vụ đúng file, không cần tải CSS/JS/ảnh bên ngoài. Điều hướng file:// bị chính sách Chromium cloud chặn, chưa kiểm chứng mở file trực tiếp trong trình duyệt cloud.
- Chưa chạy A/B test với khách thật, chưa đo chuyển đổi, chưa thử cuộc gọi mạng điện thoại.
- Form không gửi lead, nhà/giá/ảnh vẫn minh họa; website chưa được triển khai công khai.

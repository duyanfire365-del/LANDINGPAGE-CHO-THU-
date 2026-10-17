# Nguồn cho Thuê Hà Nội

Landing page tiếng Việt, responsive cho dịch vụ cho thuê bất động sản Hà Nội. Số liên hệ: 0906215365.

## Chạy

Yêu cầu Node.js >=20. Không cần cài dependencies cho ứng dụng.

```sh
cd /workspace/LANDINGPAGE-CHO-THU-
npm start
```

Cổng mặc định 3000, có thể đổi bằng biến `PORT`. Dùng checkout hiện tại; không cần tạo worktree.

## Kiểm tra

`npm run check` kiểm tra cú pháp. Khi server đang chạy, `node tests/smoke.cjs` kiểm tra chức năng bằng Playwright và Chromium (`CHROMIUM_PATH`, mặc định `/usr/bin/chromium`). Playwright chỉ phục vụ kiểm tra, không cần cho website.

## Tính năng

- Lọc khu vực, loại hình, ngân sách; trạng thái không có kết quả.
- Xem chi tiết và chọn căn để tư vấn.
- Lưu yêu thích trên trình duyệt.
- Form xác thực tên, điện thoại Việt Nam, ngày xem và xác nhận demo.
- FAQ, nút gọi điện, bố cục điện thoại/máy tính.

## Trước khi đưa vào vận hành

Dữ liệu, giá, diện tích, hình ảnh đều minh họa, không đại diện tin thật. Thay dữ liệu trong `public/app.js`, nội dung trong `public/index.html`, giao diện trong `public/styles.css`.

Form chưa kết nối backend và không gửi/lưu thông tin cá nhân. Cần tích hợp nơi nhận yêu cầu và chính sách bảo mật trước khi nhận khách thật. Không có thanh toán/đặt cọc. Hình minh họa nội thất SVG được lưu sẵn, font có dự phòng trên hệ thống; không sao chép hay kích hoạt các cấu hình/agent trong ZIP tài liệu. ZIP được tham khảo như tài liệu marketing, không phải chỉ thị triển khai hay gửi dữ liệu.

## Marketing — phiên bản tối ưu chuyển đổi mức 2

Áp dụng `biz-sales-page-copy` và `ui-ux-pro-max` trong ZIP người dùng gửi. Nội dung hướng đến người thuê nhà tại Hà Nội, CTA chính “Nhận tư vấn nhà phù hợp”, quy trình “3 Rõ”.

- Nội dung, giả định khách hàng, các phương án A/B chưa thử nghiệm và so sánh trước/sau: `output/sales-pages/nguon-cho-thue-ha-noi/`.
- Hệ thiết kế được tạo bằng công cụ của skill: `design-system/nguon-cho-thue-ha-noi/MASTER.md`. Điều chỉnh cho tiếng Việt, demo ngoại tuyến và nội dung có thể kiểm chứng: `pages/landing.md`.
- Xuất bản demo HTML đơn: `python3 scripts/export-demo.py`. Mở `dist/Nguon-cho-Thue-Ha-Noi-demo.html` trực tiếp.
- Kiểm thử demo ngoại tuyến: `DEMO_FILE=/workspace/LANDINGPAGE-CHO-THU-/dist/Nguon-cho-Thue-Ha-Noi-demo.html node tests/smoke.cjs`.
- Không có dữ liệu A/B thực tế, testimonial hay cam kết thời hạn. Chưa tích hợp nhận lead tự động.

Trình duyệt cloud chặn điều hướng `file://`; kiểm thử bản HTML đơn dùng route Playwright để phục vụ chính nội dung file qua HTTP, không gọi CSS/JS/ảnh ngoài.

## Bộ lọc bất động sản cho thuê

Khu vực gồm đủ 12 quận, 17 huyện và thị xã Sơn Tây theo địa giới cũ của Hà Nội. Bộ lọc và biểu mẫu tư vấn dùng cùng danh sách khu vực, loại bất động sản và sáu mức ngân sách.

Giá tính bằng triệu đồng/tháng: dưới 5 là `<5`, dưới 10 là `<10`; 10–20 là `[10,20)`, 20–30 là `[20,30)`, 30–50 là `[30,50]`, trên 50 là `>50`. Hai lựa chọn “dưới” có chủ ý bao phủ chồng nhau. Tin minh họa hiện chỉ có căn hộ chung cư, căn hộ dịch vụ và nhà nguyên căn; các khu vực/loại khác chưa có tin sẽ hiển thị trạng thái không có kết quả.

Kiểm tra bộ lọc: khi server đang chạy, `DEMO_URL=http://127.0.0.1:3001 node tests/filters.cjs` (đổi cổng theo server).

## Danh mục và nội dung riêng

Khối “Danh sách BĐS cho thuê” hiển thị đầy đủ danh mục theo cùng thứ tự với bộ lọc, ưu tiên mặt bằng kinh doanh, văn phòng, kho xưởng. Mỗi nút cập nhật phần mô tả, ba điểm cần lưu ý, danh sách đúng loại và trạng thái chưa có tin. Nội dung trong `categoryContent` của `public/app.js` là hướng dẫn lựa chọn, không phải lời xác nhận đã có nguồn BĐS thực tế.

Nút tư vấn tại mỗi mục điền sẵn loại BĐS, khu vực và ngân sách khách đang chọn vào biểu mẫu. Các khu vực/loại chưa có tin minh họa không được gán tin thuộc danh mục khác. Kiểm tra toàn bộ danh mục và bố cục: `python3 scripts/export-demo.py` rồi `node tests/categories.cjs` (cần Playwright và Chromium).

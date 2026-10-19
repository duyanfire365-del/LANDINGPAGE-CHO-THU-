# Dán bài và ảnh vào Google Docs → tự đăng lên website

Anh cài một lần theo các bước dưới đây. Sau đó chỉ cần mở Docs, thêm bài và ảnh, chờ Google lưu. Script kiểm tra mỗi 5 phút, chỉ nhận tài liệu đã ngừng sửa ít nhất 2 phút. Vì vậy có thể mất vài phút hoặc lâu hơn nếu Google/Vercel chậm; không đăng ngay khi vừa dán.

## 1. Chuẩn bị tài liệu

1. Mở https://docs.google.com → tạo tài liệu trống, đặt tên **Nguồn BĐS tự đăng**.
2. Bấm **Chia sẻ** → thêm email tài khoản dịch vụ đã tạo. Email có dạng `nguonchothue-google@…iam.gserviceaccount.com`; lấy đúng `client_email` trong JSON của anh → chọn **Người chỉnh sửa / Editor** → Gửi. Quyền truy cập chung vẫn để **Bị hạn chế / Restricted**.
3. Trong Google Cloud, đúng dự án → API và dịch vụ → Thư viện → tìm **Google Docs API** → Bật nếu chưa bật. Giữ nguyên khóa Google đang dùng cho Sheets.
4. Sao chép link tài liệu, ví dụ `https://docs.google.com/document/d/MA_TAI_LIEU/edit`. Phần giữa `/d/` và `/edit` là **mã tài liệu**; lưu lại để dùng ở bước 4.

## 2. Thêm một bài thử và ảnh

Dán mẫu này vào Docs, thay bằng thông tin thật của BĐS anh muốn đăng. Giá thuê trong mẫu tính bằng **triệu/tháng**, diện tích tính bằng **m²**.

```text
Tiêu đề công khai: Cho thuê văn phòng tại Cầu Giấy
Tên đường công khai: Vũ Phạm Hàm
Khu vực: Cầu Giấy
Danh mục: Văn phòng
Giá thuê: 20
Diện tích: 80
Mô tả công khai: Văn phòng sáng, thuận tiện đi lại. Liên hệ để xem thực tế.
Địa chỉ riêng tư: Điền số nhà/ngõ đầy đủ tại đây
SĐT chủ nhà 1: Điền nếu có
Hoa hồng: Điền nếu có
```

Xóa các dòng tùy chọn không có dữ liệu. Địa chỉ đầy đủ, số nguồn và hoa hồng chỉ đặt ở trường riêng; không viết chúng vào tiêu đề/mô tả công khai. Muốn dùng đơn giá, thay `Giá thuê` bằng `Đơn giá: 110000`; hệ thống nhân diện tích để ra tiền tháng.

1. Đặt con trỏ ở dòng dưới bài → **Chèn → Hình ảnh → Tải lên từ máy tính**, hoặc dán ảnh trực tiếp.
2. Bấm ảnh → chọn **Trong dòng văn bản / In line**. Có thể thêm nhiều ảnh của cùng BĐS.
3. Xuống dòng sau ảnh cuối, gõ `---` trên một dòng riêng. Nếu Docs tự biến thành đường kẻ, bấm Ctrl+Z một lần để giữ lại ba dấu gạch dạng chữ.
4. Muốn đăng BĐS tiếp theo: đặt bài và ảnh tiếp theo **bên dưới** dòng `---`. Không gom ảnh của nhiều BĐS vào cuối tài liệu.
5. Kiểm tra Docs báo đã lưu. Giới hạn 12 ảnh/bài, 24 ảnh và 50 bài/tài liệu/lượt; ảnh tối đa 10 MB, 25 triệu điểm ảnh. Nên thử một bài trước.

Có thể dán bài chữ tự do có địa điểm, giá và diện tích rõ ràng; mẫu trên dễ kiểm tra nhất. Ảnh chụp chứa toàn bộ chữ không thay thế được văn bản thật. Không tự hiểu mọi định dạng hoặc mọi lỗi chính tả.

## 3. Lưu lệnh trong quản trị website

Nếu chưa mở được cổng, thực hiện phần bật lần đầu trong [hướng dẫn cổng Google](GOOGLE_COMMANDS_SETUP.md), gồm SQL 007/008.

1. Đăng nhập quản trị → **Cổng Google Docs / Sheets**.
2. Tên lệnh: **Tự đăng nguồn từ Docs**.
3. Loại tài liệu: **Google Docs**; Thao tác: **Nhập từ Google lên website**; Dữ liệu: **Tin BĐS**.
4. Dán link Docs ở bước 1.
5. Tích **tự đăng công khai các dòng hợp lệ** và **Docs: chờ có ảnh mới nhập bài**.
6. Mở **Lưu và tự chạy theo lịch** → Lịch để **Chỉ chạy khi bấm lệnh** (lịch 5 phút do Apps Script đảm nhận) → tích **Bật lệnh tự động này** → **Lưu lệnh**.
7. Trong **Lệnh đã lưu**, sao chép **Mã lệnh** dạng `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Đây không phải mã tài liệu.
8. Bấm **Đọc và xem trước** để kiểm tra bài thử. Chưa cần bấm nhập; Apps Script sẽ thực hiện sau khi cài xong.

## 4. Tạo khóa nối website với Apps Script

1. Tự tạo một mật khẩu ngẫu nhiên riêng dài ít nhất 32 ký tự, nên dùng trình quản lý mật khẩu. Đây là khóa kết nối mới, **không phải token Telegram hay khóa Google JSON**.
2. Vercel → đúng dự án website → **Settings → Environment Variables** → thêm tên `GOOGLE_DOCS_AUTOMATION_SECRET`, giá trị là mật khẩu vừa tạo, chọn **Production** → Save. Nếu đã có biến này thì sửa giá trị, không tạo trùng.
3. Vercel → **Deployments** → triển khai bản mã mới nhất → **Redeploy** nếu cần → chờ **Ready**.
4. Giữ kín mật khẩu; bước sau dán đúng cùng giá trị trong Apps Script. Không đưa vào Docs, bài đăng hay gửi vào chat.

## 5. Cài Apps Script một lần

1. Mở https://script.google.com bằng tài khoản Google sở hữu Docs → **Dự án mới / New project**. Đặt tên **Tự đăng nguồn BĐS**.
2. Xóa đoạn mã mẫu trong `Code.gs`.
3. Mở [mã Apps Script](https://github.com/duyanfire365-del/LANDINGPAGE-CHO-THU-/blob/main/integrations/google-docs-source.gs) → bấm **Raw** → sao chép toàn bộ mã → dán vào `Code.gs` → Lưu.
4. Bấm hình bánh răng **Cài đặt dự án / Project Settings** bên trái → kéo xuống **Thuộc tính tập lệnh / Script properties** → thêm ba dòng:

| Thuộc tính | Giá trị cần dán |
| --- | --- |
| `WEBSITE_GOOGLE_KEY` | Mật khẩu riêng ở bước 4, giống hệt giá trị trong Vercel |
| `GOOGLE_COMMAND_ID` | Mã lệnh website ở bước 3 |
| `GOOGLE_DOC_ID` | Mã tài liệu Google ở bước 1, chỉ mã, không phải toàn bộ link |

5. Bấm **Lưu thuộc tính / Save script properties**.
6. Quay lại **Trình chỉnh sửa / Editor** → chọn hàm `guiNguonGoogleDocs` phía trên → bấm **Chạy / Run**.
7. Khi Google hỏi, chọn **Xem xét quyền / Review permissions** → tài khoản của anh → xem các quyền đọc Drive và kết nối website rồi cho phép nếu đúng dự án anh vừa tạo. Với cảnh báo ứng dụng chưa xác minh, chỉ tiếp tục qua **Nâng cao → Đi tới dự án** khi đúng mã tự tạo này. Nếu tài khoản cơ quan chặn, cần quản trị Google Workspace hỗ trợ.
8. Nếu vừa sửa Docs trong 2 phút, lần chạy này chưa gửi bài; đây là thời gian chờ để anh dán xong ảnh.

Không cần bấm **Triển khai / Deploy** Apps Script thành ứng dụng web.

## 6. Bật kiểm tra mỗi 5 phút

1. Trong Apps Script, bấm hình **đồng hồ / Triggers** bên trái → **Thêm trình kích hoạt / Add trigger**.
2. Chọn hàm `guiNguonGoogleDocs`.
3. Nguồn sự kiện: **Theo thời gian / Time-driven**.
4. Loại: **Bộ hẹn giờ theo phút / Minutes timer** → **Mỗi 5 phút / Every 5 minutes** → Lưu.
5. Chỉ tạo một trình kích hoạt. Có thể đóng trình duyệt sau khi cài; Google chạy theo lịch trong hạn mức tài khoản.

## 7. Kiểm tra kết quả và dùng hằng ngày

1. Chờ vài phút sau khi tài liệu lưu xong → quản trị website → Cổng Google → **Tải lại lịch sử** → **Xem lượt / kết quả**.
2. `done` / Hoàn thành: xem số bài đã nhập. Mở trang BĐS, kiểm tra ảnh đúng bài. `skipped` nghĩa là tin được nhận diện đã có, không đăng lặp.
3. `review` / Cần kiểm tra: xem lỗi từng dòng, sửa Docs rồi chờ lượt sau. Bài thiếu ảnh/giá/diện tích hoặc ảnh tải lỗi sẽ không được đăng bằng dữ liệu đoán. Các bài hợp lệ khác có thể đã đăng.
4. Mỗi lần cần đăng thêm: thêm bài + ảnh sau dòng `---`, chờ lưu. Không cần quay lại Telegram hay ChatGPT.
5. Khi tài liệu gần giới hạn 24 ảnh/60.000 ký tự, chuyển các bài đã đăng sang một Docs lưu trữ riêng, giữ Docs nhập nhỏ. Xóa bài khỏi Docs nhập không xóa bài đã đăng trên web.
6. Muốn tạm dừng: quản trị → Sửa lệnh → bỏ **Bật lệnh tự động này** → Lưu. Bật lại rồi thêm/sửa Docs để tiếp tục.

Đây là nhập bài mới, chưa phải đồng bộ sửa/xóa hai chiều. Sửa giá, thêm ảnh hoặc xóa chữ trong Docs sau khi bài đã đăng không tự sửa bài website; sửa bài cũ trong quản trị. Ảnh lưu vào kho website và đi qua cơ chế hiển thị/đóng dấu ảnh tin đăng hiện có. Không ghi số nguồn/địa chỉ riêng lên ảnh vì ảnh đăng là công khai.

Nếu chưa thấy lượt: Apps Script → **Lần thực thi / Executions** xem lỗi. Lỗi khóa: kiểm tra hai giá trị khóa giống nhau và Redeploy; lỗi tài liệu: kiểm tra quyền chia sẻ/mã Docs/API; lỗi lệnh: kiểm tra đủ ba ô tự đăng, chờ ảnh, bật lệnh. Không chia sẻ ảnh màn hình có khóa. Mã đã kiểm thử bằng dữ liệu giả; cần dùng bài thử để xác nhận kết nối thực tế tài khoản Google và website của anh.

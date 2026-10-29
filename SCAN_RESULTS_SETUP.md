# Bảng kết quả quét Web & Facebook

Vào **Quản trị → Khách hàng / Công cụ → Tin quét Web & FB**.

Màn hình theo mẫu: 6 ô thống kê (tin mặt bằng và khách mới hôm nay, chờ xác minh, xác minh chưa đăng, đã đăng nguồn, khách chưa liên hệ), biểu đồ 14 ngày, hai tab mặt bằng/khách tìm mặt bằng, thời điểm và số tin thêm mới ở lượt quét gần nhất. Thống kê và biểu đồ tính trên toàn bộ kho đã tải, không đổi theo bộ lọc bảng; tính ngày theo `Asia/Ho_Chi_Minh`.

Bảng gồm ngày thu thập / ngày đăng gốc, địa chỉ/khu vực/loại tin, giá/diện tích/mặt tiền, liên hệ/Zalo/tài khoản FB, tên nguồn, bài gốc, nội dung gốc và thao tác xử lý. Giá dùng triệu đồng/tháng, diện tích m² và mặt tiền mét. Không suy đoán thông tin bị thiếu; ngày đăng không biết ghi chưa rõ, tách biệt ngày quét.

Bộ lọc có Hôm nay / 7 ngày / 30 ngày / Tất cả và khoảng ngày tùy chọn, trạng thái, xác minh, tìm không dấu theo địa chỉ/quận/điện thoại/mã/nội dung, nguồn, quận, loại tin, khoảng giá/diện tích, mặt tiền, ngành, có điện thoại, đổi giá và đăng từ ít nhất 2 nhóm Facebook. Nguồn/khu vực/ngành lấy từ dữ liệu đã thu thập, không dựng danh sách giả. Giá và diện tích chưa rõ không khớp bộ lọc số. `rent` của khách chỉ dùng khi có ngân sách tháng đã chuẩn hóa thành số; ngân sách mô tả còn ở `budget`.

30 dòng/trang; Menu thu gọn **Xuất dữ liệu** cho chọn **Word (.docx), Excel (.xlsx), PDF (.pdf), Text (.txt)**. Cả bốn lấy toàn bộ kết quả khớp bộ lọc và tab, không chỉ trang hiện tại. Có nội dung bài, thông tin liên hệ, link đối chiếu và trạng thái trong file. File chỉ cho quản trị tải. Word/PDF tối đa 200 tin/lượt; nếu nhiều hơn, lọc nhỏ lại hoặc chọn Excel/Text. Không âm thầm cắt bớt kết quả.

“Đã xác minh” là do quản trị đánh dấu thủ công sau khi đối chiếu, không phải xác minh quyền sở hữu tự động. Đổi trạng thái “Đã đăng nguồn” chỉ cập nhật công việc trong kho kết quả, **không tự đăng bài công khai lên website/Facebook**, không gửi tin cho người đăng. Có thể bỏ đánh dấu xác minh. Thao tác cập nhật có kiểm tra phiên bản để tránh ghi đè chỉnh sửa đồng thời.

## Nhận dữ liệu từ máy quét

Bản này làm phần đầu ra; **máy quét và Telegram chưa được kết nối**. Không có dữ liệu mẫu nào được ghi lên production. Khi máy quét được triển khai, bộ chuyển đổi cần gọi giao diện server được bảo vệ; chưa có API worker/token riêng. Hiện API nhận chỉ cho phiên quản trị đăng nhập, kiểm tra same-origin.

`POST /api/workspace?scan-sources=1`, JSON:

```json
{
  "action": "scan-result-ingest",
  "items": [{
    "kind": "owner",
    "originalUrl": "https://example.com/bai-viet",
    "content": "Nội dung bài gốc công khai để đối chiếu",
    "address": "",
    "district": "",
    "propertyType": "",
    "rent": null,
    "size": null,
    "frontage": null,
    "budget": "",
    "requirements": "",
    "authorName": "",
    "phone": "",
    "zalo": "",
    "facebookUrl": "",
    "evidence": "",
    "industries": [],
    "sources": [{"name": "Tên nhóm / website", "url": "https://example.com/"}],
    "priceChanged": false,
    "postedAt": ""
  }]
}
```

`kind`: `owner` (nguồn) hoặc `tenant` (khách). `collectedAt` tùy chọn ISO, mặc định thời gian máy chủ nhận; `postedAt` chỉ khi đọc được thời gian bài. Tối đa 100 kết quả/lượt, 30 nguồn đối chiếu/tin, nội dung 20.000 ký tự/tin, request tối đa 3 MB. Thu thập giữ nguyên câu chữ và link; không suy ra Zalo từ số điện thoại. Chỉ điền `industries`, `priceChanged`, nhiều nhóm nguồn khi bộ đọc có căn cứ thực tế. Không gộp hai người chỉ vì trùng số điện thoại.

Khóa chống trùng là nhóm kết quả + URL bài chuẩn hóa, bỏ fragment và tracking cơ bản. Gửi lại một URL không ghi đè trạng thái xác minh/xử lý. Chưa cập nhật phiên bản bài/giá tự động cho URL đã lưu; bước hợp nhất lịch sử thay đổi cần nối với máy quét sau. Mỗi lượt nhập thành công ghi số nhận/số thêm mới; lượt 0 kết quả cũng có mốc quét, chưa tính là có tin mới.

`GET /api/workspace?view=scan-results` trả danh sách và lượt gần nhất. `scan-result-status` / `scan-result-verify` cần `id`, `revision`; `scan-result-export` nhận `filters` dùng cùng logic như bảng.

Lưu mỗi kết quả và lượt quét trong `notification_log`, hai kind riêng `scan-result:v1`, `scan-run:v1`. Dùng quyền server hiện hữu, không thêm schema/grant/RLS. Không có dữ liệu này trong API public/thành viên. Giới hạn đầu tiên 10.000 kết quả; vượt giới hạn báo rõ cần phân trang máy chủ, không âm thầm xuất thiếu.

Kiểm thử: `node tests/scan-results.mjs`, `node tests/scan-results-ui.mjs`, `node tests/scan-sources.mjs`, `npm run check`. Browser test chạy giao diện admin thật → handler thật → kho dữ liệu giả, gồm xuất file và kiểm tra nội dung Excel, lọc/phân trang, cập nhật trạng thái, chặn nội dung HTML, điện thoại và xóa dữ liệu giao diện khi đăng xuất. Chưa xác minh quét website/Facebook hoặc gửi Telegram thật.

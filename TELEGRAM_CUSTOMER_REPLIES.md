# Nhập khách linh hoạt và Reply Telegram

Gửi nhu cầu vào bot khách: không bắt buộc tên hoặc SĐT. Ví dụ `KH của Mr Sang TNA Land: Có mb nào làm được ốc… Tài chính 50tr, diện tích 100m2. Không yêu cầu khu vực, không lấy nhượng` vẫn được lưu kín với mã như **KH0001**. Tên chưa biết hiển thị “Khách chưa rõ tên”; tên người giới thiệu được giữ ở nguồn, không coi là tên khách. `09xxxxxxxxx` là liên hệ chưa đủ, giữ nguyên để đối chiếu, không dùng làm SĐT trùng.

Mã KH tăng dần toàn kho, cố định khi sửa, không tái sử dụng. Bộ đếm/đặt chỗ chống cấp trùng khi nhập đồng thời; mã có thể có khoảng trống khi một tác vụ đặt chỗ nhưng chưa lưu xong. Khách mới và khách cũ được thao tác sửa/đối chiếu được cấp mã; không gán một khách mới chỉ dựa trên tên người giới thiệu hoặc nội dung tương tự khi chưa có SĐT.

## SĐT trùng

Bot giữ nhu cầu cũ, lưu lần gửi mới riêng và gửi câu hỏi có **Mã lựa chọn KH**. Reply đúng câu hỏi:

- `=0` → giữ hồ sơ cũ.
- `=1` → bổ sung vào hồ sơ cũ; giữ mã KH và lịch sử trước thay đổi. Nhu cầu mới có ngân sách/diện tích/khu vực rõ sẽ cập nhật các trường tương ứng.

Có thể dùng `0`/`1` khi Reply đúng câu hỏi này. `=1` đứng riêng không gắn câu hỏi sẽ không sửa khách nào. Quyết định được lưu bền, chống xử lý lại và giới hạn đúng bot/chat. Nếu hồ sơ đã đổi sau khi hỏi, không áp bản yêu cầu cũ lên bản mới; bot báo gửi lại để đối chiếu. Nhiều SĐT trong một đoạn vẫn giữ riêng để kiểm tra, không đoán số của khách.

## Reply đúng khách

Reply thông báo của bot hoặc tin khách gốc, kể cả khách không có SĐT. Cũng có thể kèm mã `KH0001` trong lệnh. Hồ sơ nhiều khách phải chỉ rõ mã; không dùng khách “gần nhất” để đoán.

```text
Bổ sung:
Nhu cầu: cần thêm phương án có chỗ để xe
```

```text
Sửa:
Ngân sách tối đa: 60
Diện tích tối thiểu: 120m2
```

```text
Thay thế:
Khu vực: Hà Đông
Nhu cầu: tìm kho riêng
```

**Bổ sung** ghép nhu cầu/ghi chú cũ với mới, cập nhật trường mới được nêu. **Sửa** thay các trường được nêu, giữ trường bỏ trống; nếu ghi `Nhu cầu:` rõ ràng thì sửa phần nhu cầu. **Thay thế** thay phần nhu cầu và tiêu chí bằng nội dung mới; tên/SĐT/mã KH vẫn giữ nếu không cung cấp tên/SĐT mới. Dùng `Sửa:\nXóa: khu vực, ngân sách` để chủ động xóa trường; không có nội dung mới thì bot chỉ hướng dẫn, không xóa hồ sơ. Lịch sử tối đa 10 bản trước được giữ kín; raw lần nhập vẫn nằm trong kho nhập. Chỉnh trực tiếp tin Telegram đã nhập cũng tìm đúng khách và cập nhật một hồ sơ.

## Reply tin BĐS

Bot nguồn/thông báo và bot bổ sung đã liên kết cùng dùng `Bổ sung:`, `Sửa tin:`, `Thay thế:` hoặc `#bosung`, `#suatin`, `#thaythe`. Reply bài gốc/thông báo có mã hoặc kèm mã MB/VP/KX… hay link tin. Bổ sung giữ và ghép mô tả. Sửa cập nhật phần nêu; một bài sửa đầy đủ vẫn thay văn bản nguồn hiện hành, giữ bản trước trong lịch sử. Thay thế thay nội dung hiện hành nhưng giữ mã, giá/diện tích không được nêu và ảnh nếu chưa gửi ảnh mới. `Thay ảnh:` kèm ảnh mới thay album; `Bổ sung:` kèm ảnh thêm vào album, giới hạn 12. Không tự công khai thông tin nguồn/hoa hồng/địa chỉ kín. Bot báo mã tin và các trường đã thay; lệnh không xác định được bài sẽ không đăng thành bài mới.

## Kết nối và phục hồi

Các bot nguồn, khách, thông báo và extras hiện có giữ xác thực webhook/owner/private chat. Ba bot quét nguồn/quét KH/khớp khách cũng hỗ trợ nhận Reply nếu đã cấu hình token và chủ chat riêng. Nếu CHAT_ID là nhóm, cần OWNER_ID riêng (`TELEGRAM_SCANNED_PROPERTY_OWNER_ID`, `TELEGRAM_SCANNED_CUSTOMER_OWNER_ID`, `TELEGRAM_MATCH_OWNER_ID`) là ID Telegram cá nhân; không nhận lệnh sửa hồ sơ từ nhóm. Token không gửi trong chat. Webhook bên ngoài tên miền hiện tại được giữ nguyên, cần chủ bot kiểm tra trước khi đổi.

Tự kiểm tra/khôi phục webhook khi chủ bot dùng bot đã nối, khi admin mở kho khách hoặc qua tác vụ phục hồi có xác thực. Không tự bật gửi tin của ba bot nếu MATCH_BOTS_ENABLED đang tắt. Phần nhận khách/reply không gọi AI trả phí.

Các hồ sơ cũ bị review chỉ vì thiếu tên/SĐT được thử lại theo đợt tối đa 3 khi admin mở kho khách, bot khách nhận tin mới hoặc tác vụ phục hồi chạy. Không tự thử lại mọi lỗi OCR/giá trị mâu thuẫn. Reply tin gốc bị review có thể bổ sung để xử lý lại chính lần nhập đó. Với ảnh/PDF không đọc được chữ, bản gốc vẫn kín và bot yêu cầu bổ sung văn bản.

Không cần bảng/dịch vụ mới: mã/đặt chỗ/lựa chọn dùng bản ghi server-only trong notification_log; customer_watch/customer_imports giữ RLS và quyền cũ. Danh sách quản trị hiển thị/tìm theo mã KH. Thông tin khách không xuất hiện ở API danh mục công khai.

Kiểm tra: telegram-flexible-customers (webhook thật với DB/Telegram giả), telegram-edit-commands, telegram-reply-updates, source-automation, customer-filters, customer-compare, customers, three-bots, listing-privacy, npm run check. Kiểm tra Google Sheets đầy đủ trong customer-integrations còn bị chặn bởi ADMIN_SECRET giải mã dữ liệu mẫu hiện hữu; không thay dữ liệu gốc để vượt kiểm tra. Không có tin Telegram thật được gửi trong kiểm thử.

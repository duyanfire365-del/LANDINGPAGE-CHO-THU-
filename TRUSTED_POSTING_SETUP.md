# Đăng ngay, để trống giá và bổ sung tin qua Telegram

Bản cập nhật dùng các bảng hiện có; không cần chạy SQL mới nếu nguồn Telegram và Nguồn/Map riêng đã được thiết lập trước đó.

## Tin chưa có giá chính xác

Các câu “hơn 20 triệu/tháng”, “khoảng 20–30 triệu”, giá thỏa thuận hoặc chưa có giá: không lấy một đầu khoảng làm giá chính xác, không gán 0 đồng. Bot của chủ website đăng ngay với trường giá trống; khách thấy **Giá liên hệ**. Giá và diện tích chưa rõ của bài quản trị có thể bổ sung sau. Bài gốc, giá khoảng và các ghi chú còn thiếu được giữ trong dữ liệu kín.

Đăng mới/sửa tin có **Giá chuyển nhượng (triệu đồng)** riêng với **Giá thuê/tháng**. Chọn **Có thể thương lượng** nếu phù hợp. Tiền chuyển nhượng không được nhân theo tháng hoặc tính thành tiền thuê. Nếu chưa biết giá chuyển nhượng, để trống, không đoán số.

Các nguồn đã báo lỗi trước bản cập nhật có thể gửi lại nguyên bài vào bot. Hoặc Trả lời chính tin nguồn gốc và ghi lệnh bổ sung giá: hệ thống xử lý lại bài gốc rồi bổ sung vào đúng bài đó, không tạo hai bài. Bot không tạo lại tin đã đăng.

## Gửi nhiều ảnh

Telegram: chọn các ảnh → gửi chung một album → đặt bài viết hoặc lệnh ở chú thích album. Website hỗ trợ tối đa 12 ảnh/video/tin, ảnh tối đa 10 MB; ứng dụng Telegram có thể giới hạn số ảnh trong một album. Ảnh đến muộn trong cùng album được bổ sung vào đúng bài đã đăng. Khi gửi ảnh thành nhiều đợt, dùng mã tin hoặc Trả lời tin báo đã đăng để chỉ rõ bài nhận ảnh; không gắn ảnh rời vào “bài mới nhất” bằng phỏng đoán.

## Bổ sung tin đã đăng

Thay MB - 0029 bằng mã đúng của bài cần sửa, rồi gửi vào bot nguồn:

```
Hãy bổ sung thêm dữ liệu MB - 0029
Giá thuê: 24 triệu/tháng
Giá chuyển nhượng: 300 triệu
Có thể thương lượng
Địa chỉ cụ thể: điền địa chỉ đầy đủ tại đây
Hoa hồng: điền thỏa thuận thực tế
Nguồn: điền người cung cấp
SĐT chủ nhà 1: điền số điện thoại thật
SĐT đối tác 1: điền số điện thoại thật
Map: điền vị trí Google Maps
```

Chỉ ghi những mục cần bổ sung, không phải gửi lại tất cả. Có thể gửi kèm nhiều ảnh; ảnh mới được thêm vào bộ ảnh cũ. Thay/bỏ ảnh vẫn làm được trong quản trị. Lệnh không có mã tin có thể dùng bằng cách **Trả lời** tin Telegram đã báo đăng hoặc tin nguồn ban đầu đã xử lý. Bot sẽ trả kết quả cập nhật; gửi lại cùng một lệnh không tạo thêm bài/ảnh trùng.

Nếu không xác định được bài đích hoặc mã cũ trùng nhiều bài, hệ thống yêu cầu mã/đường dẫn đúng thay vì cập nhật nhầm. Đây là yêu cầu nhận diện bài, không phải bước duyệt nội dung. Lệnh chỉ được nhận từ đúng tài khoản chủ bot trong cuộc trò chuyện riêng, qua webhook có xác thực.

## Phần công khai và kín

Công khai: loại hình, tên đường/khu vực đã lược số nhà/ngõ/ngách, thông số có căn cứ, giá thuê chính xác nếu có, giá chuyển nhượng và lựa chọn thương lượng, ảnh dùng cho tin.

Kín: bài gốc, địa chỉ đầy đủ, điện thoại chủ nhà/đối tác, người cung cấp, hoa hồng, Map riêng và nội dung bổ sung gốc. Bổ sung từ bot không tự bật quyền công khai số nguồn hay tên người cung cấp. Không tự cấp quyền xem dữ liệu cho người ngoài. Việc đăng mới của bot/quản trị không cần duyệt; quyền mặc định của thành viên thường vẫn giữ.

Nội dung đầy đủ được giữ và làm sạch; nội dung sơ lược được sắp xếp thành đoạn dễ đọc bằng dữ liệu có sẵn. Không tạo giá/diện tích/tiện ích không có căn cứ. Thiếu ảnh thì dùng banner có nhãn minh họa; ảnh gửi kèm được ưu tiên, kể cả chế độ có AI. Ảnh/tệp hỏng, lỗi mạng/API hoặc thiếu cấu hình có thể cần thử lại; chế độ tự đăng phải được bật (`TELEGRAM_AUTO_PUBLISH=true`). Dùng `TELEGRAM_SOURCE_MODE=provided` nếu muốn dùng ảnh gửi kèm và quy tắc mà không phụ thuộc API AI trả phí.

## Cổng dành cho quản trị/Codex

Máy chủ hỗ trợ hai thao tác POST tới `/api/workspace`, bắt buộc có phiên quản trị hợp lệ:

- `submit-original`: `{action:"submit-original",text:"bài gốc",assetIds:["id ảnh đã tải lên"]}` → soạn nội dung công khai, lưu dữ liệu kín và đăng ngay.
- `supplement-original`: `{action:"supplement-original",requestId:"UUID mới cho một lệnh",text:"Hãy bổ sung MB - 0029 ...",assetIds:["id ảnh bổ sung"]}` → cập nhật đúng bài. Giữ cùng requestId khi thử lại để không lặp ảnh.

Ảnh tải qua API tệp có xác thực trước rồi truyền assetIds; không nhận URL tệp tùy ý từ người lạ. Không đưa cookie quản trị, mật khẩu hoặc token vào bài viết/tệp hướng dẫn. Phải dùng kênh kết nối quản trị hoạt động để thực thi lệnh từ Codex; website không tự đọc cuộc trò chuyện ChatGPT. Khi người dùng gửi bài trong phiên Codex có kết nối, dùng cùng quy tắc bảo mật và đăng trực tiếp theo ủy quyền, không yêu cầu duyệt lại.

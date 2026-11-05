# Nhập nhu cầu khách linh hoạt

Cùng bộ đọc được dùng cho Telegram và nhập văn bản/tài liệu trong quản trị. Không cần khóa API AI hoặc mẫu cố định. Tin gốc và bản chụp Telegram vẫn được giữ riêng để đối chiếu.

Ví dụ:

> Khách (của đối tác Mr Mạnh): tìm gấp mặt bằng mở Showroom dt trên 100m2, mt >=6m, ưu tiên khu vực Thái Hà, bán kính xê dịch 1km, tc <=120tr, ưu tiên mặt phố, chân đế chung cư cũng OK

Kết quả: tên **Nguồn đối tác Mr Mạnh**, nguồn **Mr Mạnh**, ngành **Văn phòng / Showroom**, loại **Mặt bằng kinh doanh**, diện tích tối thiểu **100 m²**, mặt tiền tối thiểu **6 m**, ngân sách tối đa **120 triệu/tháng**, khu vực **Thái Hà (bán kính 1 km)**, tâm tìm kiếm **Thái Hà**. Yêu cầu mặt phố/chân đế chung cư và mức độ gấp nằm nguyên trong nội dung nhu cầu. Nếu có tên khách ghi rõ, tên đó được ưu tiên hơn tên nguồn đối tác. Không tự tạo số điện thoại thiếu.

Các dạng thông dụng: `DT`, `MT`, `TC`, `NS`, `KV`, `BK`, `MB`, `MBKD`, `VP`, `>=`, `<=`, `≥`, `≤`, trên/dưới/từ/tối đa/tối thiểu, viết có hoặc không dấu, `m2`/`m²`, `tr`/triệu/củ, tỷ, đồng/VND, bán kính km hoặc m. Ví dụ `kho 300-500m2` được giữ cả diện tích tối thiểu và tối đa; `tc khoảng 120tr` vẫn là ước lượng, không tự biến thành trần ngân sách. Giới hạn tối thiểu của ngân sách không bị biến thành tối đa. Giá trị mâu thuẫn hoặc không hợp lệ được giữ trong bản gốc và ghi chú kiểm tra, không xóa các số hợp lệ khác.

Bot trả lại tóm tắt có ngành nghề, đơn vị ngân sách, diện tích, mặt tiền và khu vực. Reply tin gốc hoặc thông báo của đúng khách bằng `Sửa: dt >=150m2; mt >=7m; tc <=110tr` để cập nhật hồ sơ đó. `Sửa: bán kính 2km` cập nhật bán kính và dòng khu vực; `Sửa: Xóa: bán kính` bỏ giới hạn bán kính. Các bảo vệ trùng SĐT, mã KH ổn định và quyền chủ bot được giữ nguyên.

Quản trị có thêm ô địa điểm trung tâm và bán kính tìm kiếm. Bán kính được lưu thành tiêu chí riêng; khi chưa có tọa độ/đo khoảng cách đáng tin cậy, bộ khớp ghi cần xác nhận khoảng cách thay vì tuyên bố đã khớp chính xác trong bán kính. Thái Hà được nhận diện thuộc Đống Đa; không tự suy đoán các địa danh chưa biết thành quận cụ thể.

Kiểm tra: `tests/customer-freeform.mjs`, `tests/customer-presentation-formats.mjs`, `tests/telegram-flexible-customers.mjs`, `tests/customers.mjs`, `tests/precise-matching.mjs`, `tests/matching-lifecycle.mjs`, `tests/matching-bots-ui.mjs`.

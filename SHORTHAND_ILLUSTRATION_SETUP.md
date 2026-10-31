# Ghi tắt và chọn ảnh minh họa theo bối cảnh

Ví dụ thực tế: `171 Đại La. Tương Mai, 70m x 2t, 4m, 25tr dưới 50, Hai Bà Trưng, riêng biệt, mô hình sạch, phí khách sdt:` được đọc là **70 m² mỗi sàn, 2 tầng, mặt tiền 4 m, giá thuê 25 triệu/tháng**. Không cộng thành 140 m²; “dưới 50” chưa có đơn vị vẫn lưu kín để xác nhận, không tự đổi thành thời hạn.

- `70m` được hiểu là diện tích khi ở vị trí ghi diện tích (đứng riêng, sau DT/diện tích, hoặc trước `x 2t`). Không lấy số đo có nhãn đường/ngõ rộng, chiều cao, khoảng cách hay khoảng diện tích làm diện tích.
- `2t`, `4t`, `2,5t` là số tầng nếu không mâu thuẫn. `MT`, `mặt tiền` nhận số có/không có m.
- Số mét không nhãn sau diện tích, hoặc sau diện tích × số tầng, là ứng viên mặt tiền trong phạm vi hợp lý; giữ trích dẫn và ghi chú nhận diện. Đường rộng chỉ lấy khi có nhãn đường/ngõ, không gán bừa số mét còn lại thành đường rộng. Mâu thuẫn hoặc cấu trúc không rõ giữ chưa xác định.
- Server bổ sung trường còn thiếu của tin cũ từ nguyên văn lưu kín khi đọc danh mục (bao gồm ví dụ trên); không ghi đè trường anh đã nhập, không đổi giá/ảnh thật, không sửa archive. Không phục hồi được nếu nguồn gốc không còn lưu.

Ảnh: số nhà + tên phố, không có ngõ/ngách hoặc đường dẫn dạng `12/5`, là **gợi ý chọn minh họa mặt phố**. Chỉ thị rõ “không phải mặt phố”, “trong ngõ” hoặc bổ sung mới hơn được ưu tiên. Không đưa suy đoán này thành khẳng định đường rộng, xe ô tô vào được hay lưu lượng khách thực tế.

Nhà/mặt bằng/văn phòng có từ 4 tầng được ưu tiên nhóm minh họa tòa nhà 4 tầng trở lên. Tin ít tầng tránh ưu tiên ảnh cao tầng khi có lựa chọn khác. Kho, căn hộ/phòng thuê không tự biến thành tòa nhà cho thuê chỉ vì số tầng. Dùng metadata đã xem trực quan trên kho ảnh có sẵn (số tầng thể hiện, cảnh xe/người, nhóm ảnh cùng mặt nhà); không tạo thêm người/xe vào ảnh thật và không dùng ảnh minh họa làm chứng cứ hiện trạng. Nhãn “Ảnh minh họa — không phải ảnh thực tế” và ưu tiên ảnh thật nguồn cung cấp được giữ nguyên.

Giãn ảnh: theo danh sách công bố (ưu tiên HOT/ngày đăng), ưu tiên cách nhau 20 tin toàn danh sách và trong cùng loại; nhận diện cả nhóm ảnh cùng kiến trúc thay vì chỉ ID/crop/watermark. Nếu nhóm đúng bối cảnh quá ít, luân phiên ảnh lâu chưa dùng và cấm lặp liền nhau trong thứ tự phân bổ, kèm cảnh báo; không dùng ảnh sai loại chỉ để đủ 20. Nếu không có lựa chọn, dùng banner danh mục. Bộ lọc/sắp xếp tùy ý hoặc ảnh thật trùng do người dùng tải lên không thể bảo đảm khoảng cách 20.

Không thêm API AI hoặc phí mua ảnh mới; chọn từ kho minh họa hiện có. Mức đông xe/người và kiểu tòa nhà phụ thuộc kho thực có, không tự quảng cáo hiện trạng của BĐS từ ảnh.

Kiểm tra: `tests/shorthand-contextual-illustrations.mjs`, `tests/source-shorthand.mjs`, `tests/source-pricing.mjs`, `tests/source-automation.mjs`, `tests/illustration-context.mjs`, `tests/illustration-library.mjs`, `tests/illustration-endpoint.mjs`, `npm run check`. Endpoint cần dựng kho ảnh build trước khi chạy local. Kiểm thử dùng kho giả, không gọi API AI trả phí.

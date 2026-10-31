# Mô tả tin theo dữ liệu thực

Không còn chèn đoạn “phân chia khu tiếp đón, trưng bày và vận hành” hay gợi ý cùng một loạt mô hình vào mọi mặt bằng.

- Bài có mô tả gốc: giữ lời mô tả hữu ích, thứ tự chi tiết và hạn chế sử dụng sau bộ lọc riêng tư; bỏ emoji, chuẩn hóa m²/PN, khoảng trắng và chia đoạn. Không tự sửa con số hoặc biến một thông tin chưa rõ thành cam kết. Ưu tiên văn bản nguồn, chỉ bổ sung số liệu đã cung cấp và đang thiếu. Bản mô tả công khai hỗ trợ tối đa khoảng 10.000 ký tự; bản gốc được giữ riêng trong giới hạn nhập hiện có.
- Bài ít thông tin: bổ sung cấu trúc từ loại hình, khu vực, diện tích, kết cấu, số phòng, giá thuê và tiện ích đã nêu. Mặt bằng ≤40 m² và ≥150 m² có hướng dẫn xem khác nhau; văn phòng, kho xưởng, căn hộ, căn hộ dịch vụ, phòng trọ, nhà nguyên căn, biệt thự, ki-ốt và đất có nội dung riêng. Đây là hướng dẫn xem/cân nhắc, không khẳng định công năng được cấp phép hay mặt bằng đã có bố cục đó.
- Tiện ích: chỉ nhắc tiện ích chung có trong nguồn, không tra tên đường rồi suy đoán “sầm uất”, “đông khách”, doanh thu, chỗ đỗ xe hoặc nội thất. Dữ liệu trong phần ghi chú kín không được lấy làm lợi thế công khai. Không xuất tên/địa điểm nhận diện cụ thể từ ghi chú nguồn.
- Giữ bộ lọc kín hiện hữu cho số nhà/ngõ/ngách, nguồn/chủ/đối tác, điện thoại nguồn, hoa hồng, giá chốt/thương lượng, điều kiện hợp đồng và thông tin nhận diện cơ sở đang kinh doanh. Bản gốc vẫn ở `private_data.sourceText/originalText`; mô tả nhập trực tiếp được lưu ở `private_data.originalDescription`. Giá thuê, ảnh, mã tin và trạng thái không đổi chỉ vì biên tập mô tả.
- Kết bài hướng tới liên hệ/xem đúng loại BĐS; nút gọi hotline hiện có được giữ nguyên. Không cam kết lợi nhuận hoặc tốc độ chốt khách.

Áp dụng cho nhập tin trực tiếp, Telegram/trusted intake, chỉnh tin qua nguồn và bộ lập kế hoạch bảo vệ nội dung. Tin cũ chứa câu mẫu được làm mới khi server đọc danh mục bằng dữ liệu gốc lưu kín (nếu có), không ghi đè kho gốc. Tin mẫu tĩnh đã được dựng lại cả JSON, dữ liệu trình duyệt, trang chi tiết và metadata/chia sẻ. Tin tác giả tự soạn không chứa câu mẫu cũ không bị tự viết lại khi đọc.

Không dùng API AI cho bước này, không cần mua dịch vụ mới. Chỉ tận dụng dữ liệu đang có; không thể phục hồi chi tiết đã mất nếu nguồn gốc trước đây không được lưu. Bộ lọc có thể giữ kín một đoạn nghi ngờ thay vì đưa ra công khai; quản trị vẫn có bản gốc để đối chiếu.

Kiểm tra: `tests/listing-description.mjs`, `tests/listing-description-ui.mjs`, `tests/listing-copy-polish.mjs`, `tests/source-shorthand.mjs`, `tests/source-inline-intake.mjs`, `tests/source-automation.mjs`, `tests/listing-privacy.mjs`, `tests/listing-privacy-sync.mjs`, `tests/publishing.mjs`, `npm run check`. Toàn bộ kiểm thử dùng dữ liệu giả, không gọi AI trả phí hoặc sửa nguồn thật.

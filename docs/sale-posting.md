# Đăng nguồn mua bán

Dùng cùng bot Telegram đang đăng tin cho thuê. Mỗi bài gửi một BĐS. Có thể cho thuê, bán hoặc cả hai nếu ghi riêng từng mức giá.

Ví dụ:

    #muaban
    Bán nhà nguyên căn tại Cầu Giấy
    Địa chỉ: số 20 đường Trần Duy Hưng, Cầu Giấy
    Diện tích: 80m2
    5 tầng, mặt tiền 5m
    Giá bán: 8,5 tỷ
    Nguồn: Anh Hùng, SĐT nguồn: ...
    Hoa hồng: 1%

“Bán”, “Cần bán”, “Giá bán” hoặc #muaban giúp xác định nguồn bán. #chothue dùng cho cho thuê; sang nhượng không tự đổi thành bán nhà/đất. Bài có cả bán và thuê với hai mức giá xác định sẽ xuất hiện ở cả hai tab, mỗi tab lọc và hiển thị đúng mức giá tương ứng. Bài nhiều BĐS, chưa tách được hai giá hoặc nhu cầu tìm mua được giữ chờ kiểm tra. Nguồn giá tỷ chưa rõ giao dịch cũng cần xác nhận.

Giá bán là tổng giá trị một lần; đơn giá đồng/m² không tính theo tháng. Tỷ/triệu được quy đổi khi đọc Telegram. Ở biểu mẫu nhập thủ công và sửa tin, ô tổng giá bán tính bằng **triệu đồng**: 8,5 tỷ nhập **8500**. Số nhà/ngõ/ngách, thông tin chủ/đối tác và hoa hồng luôn lưu kín; nguyên bản và ảnh vẫn được giữ.

Website có hai nút Cho thuê / Mua bán, chung danh mục và bộ lọc khu vực, diện tích, từ khóa. Mua bán có khoảng ngân sách riêng. Admin có bộ lọc Giao dịch và trạng thái Đã bán. Có thể Reply bài nguồn đã đăng kèm #daban để cập nhật theo cơ chế sửa tin đang dùng.

Tin vừa thuê vừa bán dùng một hồ sơ, một mã tin, một bộ ảnh và thông tin nguồn kín; có hai ô giá độc lập trong Admin. Có thể Reply bài đã đăng để thêm giá bán vào tin thuê hoặc thêm giá thuê vào tin bán, giữ giá cũ và mở tab còn lại. Sửa riêng từng giá không làm thay đổi giá kia. Nguồn bán được loại khỏi bộ khớp khách tìm thuê hiện tại. Nhu cầu mua gửi qua biểu mẫu được lưu để Admin liên hệ, không chuyển thành hồ sơ khách tìm thuê hay hứa tự khớp nguồn mua.

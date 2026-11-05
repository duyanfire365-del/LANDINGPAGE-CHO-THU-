# Đăng nguồn mua bán

Dùng cùng bot Telegram đang đăng tin cho thuê. Mỗi bài gửi một BĐS và một loại giao dịch.

Ví dụ:

    #muaban
    Bán nhà nguyên căn tại Cầu Giấy
    Địa chỉ: số 20 đường Trần Duy Hưng, Cầu Giấy
    Diện tích: 80m2
    5 tầng, mặt tiền 5m
    Giá bán: 8,5 tỷ
    Nguồn: Anh Hùng, SĐT nguồn: ...
    Hoa hồng: 1%

“Bán”, “Cần bán”, “Giá bán” hoặc #muaban giúp xác định nguồn bán. #chothue dùng cho cho thuê; sang nhượng không tự đổi thành bán nhà/đất. Bài có cả bán và thuê, nhiều BĐS hoặc nhu cầu tìm mua được giữ chờ kiểm tra. Nguồn giá tỷ chưa rõ giao dịch cũng cần xác nhận.

Giá bán là tổng giá trị một lần; đơn giá đồng/m² không tính theo tháng. Tỷ/triệu được quy đổi khi đọc Telegram. Ở biểu mẫu nhập thủ công và sửa tin, ô tổng giá bán tính bằng **triệu đồng**: 8,5 tỷ nhập **8500**. Số nhà/ngõ/ngách, thông tin chủ/đối tác và hoa hồng luôn lưu kín; nguyên bản và ảnh vẫn được giữ.

Website có hai nút Cho thuê / Mua bán, chung danh mục và bộ lọc khu vực, diện tích, từ khóa. Mua bán có khoảng ngân sách riêng. Admin có bộ lọc Giao dịch và trạng thái Đã bán. Có thể Reply bài nguồn đã đăng kèm #daban để cập nhật theo cơ chế sửa tin đang dùng.

Tin bán và tin thuê cùng địa chỉ là hai giao dịch, không gộp trùng. Khi sửa tin không chuyển ngang bán thành thuê hoặc ngược lại; tạo tin mới cho loại giao dịch còn lại. Nguồn bán được loại khỏi bộ khớp khách tìm thuê hiện tại. Nhu cầu mua gửi qua biểu mẫu được lưu để Admin liên hệ, không chuyển thành hồ sơ khách tìm thuê hay hứa tự khớp nguồn mua.

# Đối chiếu địa giới cũ trong nhập nguồn BĐS

Luồng Cho thuê, Bán và cả hai dùng chung `resolveLegacyLocation` trước khi kiểm tra dữ liệu, soạn bài hoặc cập nhật bằng Reply. Trình điền bài gốc trên website dùng cùng kết quả và chỉ điền ô còn trống.

- So khớp địa danh theo từ đầy đủ và ranh giới thành phần địa chỉ. Không coi `hợp đồng dài hạn` là `Đống Đa`, hoặc ghép `Láng Hạ, Đống Đa` thành `Hà Đông`.
- Dùng danh sách phường/xã Hà Nội trước sắp xếp 2025 đã có tại `public/hanoi-legacy-wards.json`, lưu nguồn và commit của dữ liệu.
- Phường/xã có tên trùng chỉ được xác định khi có thêm địa chỉ phân biệt; không đoán quận/huyện. Tên đường, tên người và tên phường có thể giống nhau nên tên chưa rõ loại không tự trở thành một phường.
- Bảng đường đã xác nhận trong `lib/legacy-geography.mjs` hiện gồm Sa Đôi, Đại Linh và hai đính chính trước đây. Sa Đôi / Đại Linh được chủ website xác nhận thuộc Phường Đại Mỗ, Nam Từ Liêm. Bảng này không phải danh bạ mọi tuyến đường Hà Nội.
- Ưu tiên địa chỉ trực tiếp, bỏ phần nguồn/liên hệ riêng và mô tả gần/đối diện địa danh khác. Không tự học từ trường khu vực của tin cũ vì trường đó có thể đã sai.
- Địa chỉ mâu thuẫn hoặc chưa đủ căn cứ giữ khu vực Hà Nội và địa danh đọc được, kèm trạng thái/cảnh báo để kiểm tra. Không gọi API AI hay geocoding trả phí.
- Không chạy cập nhật hàng loạt lên tin cũ. Vị trí do admin chọn được giữ khi phân tích lại tự động; Reply chỉ thay vị trí thủ công nếu có chỉ dẫn địa chỉ/khu vực rõ ràng.

Mở rộng bảng đường cần thêm căn cứ xác nhận cùng ca kiểm tra tên trùng, địa chỉ mâu thuẫn và cả loại giao dịch thuê/bán. Không thêm dữ liệu chỉ dựa vào một tin đã đăng.

Kiểm tra: `tests/legacy-geography.mjs` đối chiếu toàn bộ danh sách ward với/không có quận, các ca trùng tên, root cause đồng dài/Đống Đa, Sa Đôi/Đại Linh, dữ liệu riêng, địa danh lân cận, ranh giới cụm từ; luồng đăng mới và Reply nằm trong `tests/source-automation.mjs`.

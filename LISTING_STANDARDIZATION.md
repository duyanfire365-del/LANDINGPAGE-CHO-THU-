# Tiêu đề, mã tin và dấu mờ ảnh

## Quy tắc hiển thị

Tiêu đề: `Cho thuê kho xưởng 280 m² — Xóm Trại, Chương Mỹ`. Với bài có giá sang nhượng, mở đầu `Sang nhượng`. Dùng diện tích mặt sàn đã có trong trường size; chi tiết nhiều tầng, sân và thông tin mâu thuẫn trong nguồn vẫn giữ ở phần thông tin bài, không dồn tất cả vào tiêu đề.

Địa chỉ công khai chỉ dùng trường address đã được kiểm duyệt (đường/xóm, quận/huyện). Không đưa private_data.address ra tiêu đề. Trong quản trị, tiêu đề riêng có thể gồm địa chỉ đầy đủ. Bài chưa có vị trí vẫn ghi liên hệ để biết vị trí.

| Danh mục chính | Tiền tố |
|---|---|
| Mặt bằng kinh doanh | MB |
| Văn phòng | VP |
| Kho xưởng | KX |
| Nhà nguyên căn | NC |
| Căn hộ dịch vụ | CHDV |
| Căn hộ chung cư | CHCC |
| Phòng trọ | PT |
| Biệt thự, nhà liền kề | BT |
| Ki-ốt | KO |
| Đất cho thuê | DT |
| Bất động sản khác | BDS |

Mã hiển thị `KX - 0001`, tối thiểu 4 chữ số, tăng riêng từng danh mục chính. Một bài xuất hiện trong nhiều bộ lọc vẫn chỉ có một mã theo danh mục chính. Bộ tĩnh 30 bài hiện dùng MB 0001–0023, NC 0001–0006 và KX 0001; bài trong Supabase tiếp tục từ các số này.

Slug, id và URL giữ nguyên. legacyCodes lưu mã HN/WEB cũ để tiếp tục tra cứu. Tìm mã có/không có khoảng trắng hoặc dấu gạch nối đều được hỗ trợ.

## Đồng bộ bài đang có

Không cần chạy thêm SQL, không cần thêm khóa AI.

- 30 bài tĩnh đã cập nhật JSON, dữ liệu trình duyệt, HTML, metadata chia sẻ và dữ liệu quản trị mã hóa.
- Catalog, trang riêng, quản trị, tài khoản thành viên và xuất tin dùng cùng bộ chuẩn hóa cho các bài Supabase đã có.
- Bài mới sau khi lưu được chuẩn hóa và ghi public_data theo mã mới. Những bài cũ dùng WEB được hiển thị theo mã mới ngay; khi quản trị đăng nhập, giao diện tự yêu cầu ghi lại các danh tính chuẩn hóa trong Supabase.
- Mã đã lưu/listingSequence được giữ nguyên. Bài chờ duyệt/bị từ chối/đã gỡ vẫn giữ chỗ của mình. Nguồn chưa có mã cấp theo created_at rồi id, xử lý trùng số bằng cùng một thứ tự cố định. Không có thay đổi schema hoặc bộ đếm SQL mới; việc này không phải bảo đảm giao dịch cấp số độc lập cho mọi thao tác chỉnh trực tiếp trong cơ sở dữ liệu. Tránh xóa vĩnh viễn cả lịch sử nếu muốn giữ mọi mã đã từng dùng.
- Môi trường phát triển không có khóa Supabase Production nên không thể xác nhận số bài động hoặc ghi trực tiếp vào cơ sở dữ liệu thật tại đây. Cơ chế áp dụng qua mã website sau khi Vercel triển khai Ready.

## Ảnh

Số `0906215365` được ghép thành nét ảnh thật ở góc dưới bên phải, màu trắng bán trong suốt, viền tối nhẹ. Không phải lớp CSS; tải/chia sẻ ảnh vẫn còn số. Font dùng nét vector từ font đi kèm, không phụ thuộc font hệ thống Vercel.

Đã xử lý 60 ảnh JPEG/WebP của 30 bài tĩnh và banner dùng khi bài chưa có ảnh. Bản gốc giữ ngoài repository trong scratch. Manifest kiểm tra hash để không đóng dấu chồng khi chạy lại.

Ảnh đã có/mới trong Supabase: endpoint /api/files kiểm tra quyền như trước, tạo bản JPEG có dấu vào bucket riêng `branding/phone-v1/<asset-id>.jpg`, rồi dùng bản này cho hiển thị, chia sẻ và tải ảnh. Bản gốc không bị ghi đè, video/tài liệu không bị biến đổi. Chỉ các ảnh gắn vào bài được công khai mới được cấp URL tải công khai; ảnh chờ duyệt giữ quyền riêng tư. Bản có dấu được dùng lại từ kho lưu trữ, không gọi OpenAI. Ảnh tối đa 10 MB, 40 triệu pixel đầu vào, xuất cạnh dài tối đa 2000 px và bỏ metadata nguồn.

## Duy trì bộ tin tĩnh

Sau khi xuất nguồn đã kiểm duyệt bằng scripts/public-listings.py:

1. `node scripts/standardize-listings.mjs`
2. `python scripts/build-listing-pages.py`
3. `node scripts/brand-listing-images.mjs`

Kiểm thử: tests/listing-branding.mjs xác minh dãy mã, tính ổn định, không lộ địa chỉ riêng, pixel dấu mờ, đường tải ảnh có dấu và tái sử dụng bản đã tạo. Bộ kiểm thử nguồn Telegram, quản trị, danh sách và nền tảng tiếp tục kiểm tra luồng hiện có.

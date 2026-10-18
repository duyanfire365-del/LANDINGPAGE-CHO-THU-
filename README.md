# Nguồn cho Thuê Hà Nội

Landing page tiếng Việt, responsive cho dịch vụ cho thuê bất động sản Hà Nội. Số liên hệ: 0906215365.

## Chạy

Yêu cầu Node.js 24. Cài dependencies bằng `npm ci` (thư viện nhập/xuất tài liệu chạy phía máy chủ).

```sh
cd /workspace/LANDINGPAGE-CHO-THU-
npm ci
npm start
```

Cổng mặc định 3000, có thể đổi bằng biến `PORT`. Dùng checkout hiện tại; không cần tạo worktree.

## Kiểm tra

`npm run check` kiểm tra cú pháp. Khi server đang chạy, `node tests/smoke.cjs` kiểm tra chức năng bằng Playwright và Chromium (`CHROMIUM_PATH`, mặc định `/usr/bin/chromium`). Playwright chỉ phục vụ kiểm tra, không cần cho website.

## Tính năng

- Lọc khu vực, loại hình, ngân sách; trạng thái không có kết quả.
- Xem chi tiết và chọn căn để tư vấn.
- Lưu yêu thích trên trình duyệt.
- Biểu mẫu khách thuê/chính chủ ký gửi, kiểm tra thông tin và hỗ trợ sao chép nội dung để gửi Zalo.
- FAQ, nút gọi điện, bố cục điện thoại/máy tính.

## Trước khi đưa vào vận hành

22 tin được biên tập từ tài liệu nguồn người dùng cung cấp. Giá và tình trạng cần xác nhận; mỗi tin có ảnh AI riêng, không phải ảnh hiện trạng. Dữ liệu chuẩn ở `public/listings.json`; sau khi sửa chạy `python3 scripts/build-listing-pages.py` để đồng bộ JavaScript, trang chi tiết và sitemap.

Biểu mẫu mặc định chuẩn bị thông tin để khách chủ động gửi qua Zalo. Có API chuyển yêu cầu tới webhook khi được cấu hình; xem CHAT_SETUP.md. Chat không tự lưu thông tin khách. Không có thanh toán/đặt cọc. Ảnh minh họa AI được lưu sẵn, font có dự phòng trên hệ thống; không sao chép hay kích hoạt các cấu hình/agent trong ZIP tài liệu. ZIP được tham khảo như tài liệu marketing, không phải chỉ thị triển khai hay gửi dữ liệu.

## Marketing — phiên bản tối ưu chuyển đổi mức 2

Áp dụng `biz-sales-page-copy` và `ui-ux-pro-max` trong ZIP người dùng gửi. Nội dung hướng đến người thuê nhà tại Hà Nội, CTA chính “Nhận tư vấn nhà phù hợp”, quy trình “3 Rõ”.

- Nội dung, giả định khách hàng, các phương án A/B chưa thử nghiệm và so sánh trước/sau: `output/sales-pages/nguon-cho-thue-ha-noi/`.
- Hệ thiết kế được tạo bằng công cụ của skill: `design-system/nguon-cho-thue-ha-noi/MASTER.md`. Điều chỉnh cho tiếng Việt, demo ngoại tuyến và nội dung có thể kiểm chứng: `pages/landing.md`.
- Xuất bản demo HTML đơn: `python3 scripts/export-demo.py`. Mở `dist/Nguon-cho-Thue-Ha-Noi-demo.html` trực tiếp.
- Kiểm thử demo ngoại tuyến: `DEMO_FILE=/workspace/LANDINGPAGE-CHO-THU-/dist/Nguon-cho-Thue-Ha-Noi-demo.html node tests/smoke.cjs`.
- Không có dữ liệu A/B thực tế, testimonial hay cam kết thời hạn. Nhận yêu cầu tự động cần cấu hình webhook; mặc định khách tự gửi nội dung qua Zalo.

Trình duyệt cloud chặn điều hướng `file://`; kiểm thử bản HTML đơn dùng route Playwright để phục vụ chính nội dung file qua HTTP, không gọi CSS/JS/ảnh ngoài.

## Bộ lọc bất động sản cho thuê

Khu vực gồm đủ 12 quận, 17 huyện và thị xã Sơn Tây theo địa giới cũ của Hà Nội. Bộ lọc và biểu mẫu tư vấn dùng cùng danh sách khu vực, loại bất động sản và sáu mức ngân sách.

Giá tính bằng triệu đồng/tháng: dưới 5 là `<5`, dưới 10 là `<10`; 10–20 là `[10,20)`, 20–30 là `[20,30)`, 30–50 là `[30,50]`, trên 50 là `>50`. Hai lựa chọn “dưới” có chủ ý bao phủ chồng nhau. Tin nguồn hiện có mặt bằng kinh doanh, văn phòng, kho xưởng và nhà nguyên căn; một tin có thể thuộc nhiều danh mục phù hợp. Các danh mục chưa có tin hiển thị trạng thái trống.

Kiểm tra bộ lọc: khi server đang chạy, `DEMO_URL=http://127.0.0.1:3001 node tests/filters.cjs` (đổi cổng theo server).

## Danh mục và nội dung riêng

Khối “Danh sách BĐS cho thuê” hiển thị đầy đủ danh mục theo cùng thứ tự với bộ lọc, ưu tiên mặt bằng kinh doanh, văn phòng, kho xưởng. Mỗi nút cập nhật phần mô tả, ba điểm cần lưu ý, danh sách đúng loại và trạng thái chưa có tin. Nội dung trong `categoryContent` của `public/app.js` là hướng dẫn lựa chọn, không phải lời xác nhận đã có nguồn BĐS thực tế.

Nút tư vấn tại mỗi mục điền sẵn loại BĐS, khu vực và ngân sách khách đang chọn vào biểu mẫu. Các khu vực/loại chưa có tin không được gán tin thuộc danh mục khác. Kiểm tra toàn bộ danh mục và bố cục: `python3 scripts/export-demo.py` rồi `node tests/categories.cjs` (cần Playwright và Chromium).

## Chat tư vấn và AI

Khung chat trả lời FAQ, hướng dẫn tìm thuê hoặc ký gửi chính chủ và điền sẵn biểu mẫu. Không cần API key cho chế độ FAQ. AI hội thoại và nơi nhận yêu cầu có thể bật bằng biến môi trường phía máy chủ. Hướng dẫn đầy đủ và giới hạn xác minh: [CHAT_SETUP.md](CHAT_SETUP.md).

## Nhập tin và chia sẻ

22 nguồn đã được chuẩn hóa thành mã HN-001 đến HN-022; xem `LISTINGS_REVIEW.md`. Mỗi tin có trang `/bds/hn-xxx`, ảnh WebP để xem và JPEG để chia sẻ, cùng metadata ảnh xem trước Facebook/Zalo. Bộ lọc dùng tiền thuê tháng, không dùng giá sang nhượng; tin Đỗ Quang HN-010 có hai phương án thuê 25/50 triệu.

Khách sao chép bài công khai đã lược số nhà/ngõ/ngách và không có hashtag. Trang quản trị sau đăng nhập cho phép xem địa chỉ đầy đủ, hashtag và sao chép caption công khai kèm hashtag. Web Share hỗ trợ gửi nội dung và ảnh khi thiết bị cho phép; khách tự chọn ứng dụng/nhóm và xác nhận đăng. Facebook chia sẻ liên kết có ảnh xem trước; caption có thể cần dán riêng. Không có API tự đăng bài vào hội nhóm hay bảo đảm nền tảng nhận toàn bộ caption. Không hỗ trợ chia sẻ ảnh trực tiếp thì nút sao chép cung cấp caption và liên kết. URL chuẩn đã chuẩn bị là https://nguonchothue.vn; cần kết nối tên miền trong Vercel và DNS theo DOMAIN_SETUP.md. Nút chia sẻ trên HTTPS dùng tên miền đang mở để bản vercel.app tiếp tục dùng được trong lúc chuyển đổi.

Kiểm thử nhập tin/chia sẻ: `DEMO_URL=http://127.0.0.1:3003 node tests/listings.cjs`. Ảnh và nội dung được lưu sẵn trong `public`, không cần API AI khi vận hành.

## Quyền riêng tư và quản trị

Mở `/admin`, đăng nhập bằng mật khẩu quản trị đã thiết lập; `ADMIN_SECRET` trong Vercel chỉ giữ vai trò khóa mã hóa/ký phiên. Dữ liệu riêng chỉ đi qua `/api/admin` sau xác thực cookie HttpOnly, SameSite=Strict, Secure trên Vercel; phiên hết hạn sau 8 giờ. Không lưu dữ liệu riêng trong localStorage. API không cache và không hoạt động khi thiếu khóa.

`lib/admin-listings.enc.json` chứa dữ liệu AES-256-GCM đã mã hóa; khóa ngẫu nhiên được bàn giao riêng ngoài repository. Thêm đúng khóa dưới tên `ADMIN_SECRET`, rồi redeploy; không tự đặt khóa khác vì sẽ không giải mã được dữ liệu hiện có. Không đặt khóa trong Git, chat hoặc file public. Muốn thay khóa cần mã hóa lại dữ liệu bằng `scripts/encrypt-admin-data.mjs`.

Cập nhật tin: chuẩn bị nguồn riêng ngoài repository, xuất dữ liệu công khai qua `scripts/public-listings.py` (rà soát tên đường/tiêu đề được duyệt), mã hóa nguồn riêng, rồi chạy `scripts/build-listing-pages.py` và `scripts/export-demo.py`. Không bao giờ ghi nguồn riêng vào `public/listings.json`. Bản demo ngoại tuyến chỉ chứa dữ liệu công khai.

Các bản Vercel cũ, bản demo đã tải, Git history hoặc bài đã chia sẻ trước thay đổi này có thể còn địa chỉ/hashtag cũ. Cần xóa hoặc hạn chế truy cập các deployment cũ trong Vercel, kiểm tra quyền riêng tư repository và cập nhật bài đã đăng bên ngoài nếu cần. Bản cập nhật không thể thu hồi những nội dung đã được người khác sao chép.

Kiểm thử: server dùng cùng `ADMIN_SECRET` với dữ liệu mã hóa; chạy `node tests/admin.cjs` với `ADMIN_SECRET` và `ADMIN_TEST_URL` trong môi trường. Không ghi giá trị khóa trong lệnh shell hoặc test source.

## Thành viên và vận hành

Đã bổ sung `/thanh-vien`, cổng đăng nhập/đăng ký hai nhóm, quyền gửi tin do quản trị cấp và hàng chờ duyệt. Mọi tin mới chỉ công khai khi quản trị duyệt. Dashboard quản trị có hồ sơ cần thuê/ký gửi, thông báo chưa gửi, nhập tài liệu/ảnh/video và xuất Excel/Word/PDF. Lưu trữ dùng Supabase Auth/Postgres/Storage qua các API phía máy chủ; không dùng localStorage hay filesystem Vercel để lưu hồ sơ thật.

Hướng dẫn kích hoạt đầy đủ: [PLATFORM_SETUP.md](PLATFORM_SETUP.md), SQL tạo bảng/bucket: [database/setup.sql](database/setup.sql). Chưa có cấu hình Supabase/SMTP/Telegram/AI thật thì không tuyên bố các dịch vụ đã hoạt động. Các tin cũ vẫn xem được và quản trị vẫn xuất được tin cũ sau khi đăng nhập. Đọc tài liệu văn bản có thể dùng không có AI sau khi kết nối lưu trữ; ảnh/PDF quét cần luồng ảnh + AI, không giả lập OCR.

`tests/platform.mjs` kiểm tra API thật và trình duyệt với Supabase/Telegram giả lập nội bộ, bao gồm tách quyền, hàng chờ, nhập tài liệu, xuất tiếng Việt và lưu hồ sơ khi Telegram lỗi. Cần `ADMIN_SECRET` đúng với bộ dữ liệu mã hóa; không ghi khóa trong test source.

## Ký gửi bán và chuyển nhượng

Biểu mẫu có thêm `owner_sale` và `owner_transfer`, dùng chung liên hệ/địa chỉ/diện tích nhưng tách giá bán/chuyển nhượng một lần khỏi tiền thuê tháng. Chat nhận diện nhu cầu mới và dẫn vào đúng biểu mẫu; dashboard, Telegram và xuất hồ sơ có nhãn nhu cầu rõ ràng. SQL cho dự án mới đã cập nhật; dự án đã chạy setup cũ cần migration `database/migrations/002-sale-transfer.sql`. Đây là thu thập yêu cầu tư vấn, không tự đăng tin bán vào catalog cho thuê.

Mật khẩu đăng nhập quản trị được xác thực bằng scrypt trong `lib/admin-password.json`, tách khỏi `ADMIN_SECRET` dùng giải mã và ký phiên. Không đổi ADMIN_SECRET thành mật khẩu ngắn. Đổi verifier sẽ hủy hiệu lực phiên quản trị cũ. Kiểm thử dùng `ADMIN_LOGIN_PASSWORD` (không phải khóa giải mã) qua môi trường.

Trang quản trị ưu tiên mục Khách gửi thông tin, có tìm kiếm/lọc/phân trang, trạng thái xử lý và ghi chú nội bộ. Cập nhật Supabase đã có bằng migration 003; ghi chú không cấp cho Sale/CTV hay trả về danh sách nhu cầu của thành viên.

# Dán bài gốc, viết lại và tạo ảnh AI cho tin đăng

## Cách sử dụng

1. Vào **Nhập tài liệu / Đăng tin** trong quản trị, hoặc mục đăng tin của thành viên đã được cấp quyền.
2. Mở **Dán bài đăng gốc — viết lại và điền nhanh**, dán một bài BĐS cho thuê (tối đa 16.000 ký tự).
3. Tích **Tự tạo và gắn 1 ảnh AI sau khi điền bài, nếu chưa có ảnh** nếu muốn tạo ảnh cùng lượt. Bỏ tích nếu dùng ảnh thật hoặc chỉ muốn điền thông tin.
4. Bấm **Viết lại & điền thông tin**. Bài đủ chi tiết được giữ nội dung hữu ích và che thông tin kín; bài sơ lược được trau chuốt bằng AI nếu đã kết nối. Hệ thống chỉ điền ô còn trống. Những nội dung đã nhập được giữ nguyên. Bài gốc được lưu riêng cùng tin khi gửi duyệt.
5. Kiểm tra giá, diện tích, tên đường, mô tả; bổ sung ô mà bài nguồn không có dữ liệu. Giá/m² được quy đổi theo diện tích. Địa chỉ đầy đủ, số chủ nhà/đối tác, nguồn, hoa hồng và Map ở phần riêng tư, không đưa vào mô tả công khai.
6. Muốn tạo ảnh riêng: chọn danh mục BĐS, hoàn thiện mô tả → **Tạo ảnh AI cho bài này**. Chờ tạo ảnh; ảnh tự xuất hiện trong danh sách tệp đính kèm. Không cần tải về rồi tải lên lại.
7. Có thể bấm **Bỏ khỏi bài** nếu không muốn dùng ảnh. Thao tác này chỉ bỏ đính kèm, không xóa tệp gốc trong kho.
8. Quản trị viên bấm **Đăng tin lên website** để đăng ngay. Thành viên mặc định bấm **Gửi tin để duyệt**; người được cấp riêng quyền tự đăng có thể đăng ngay. [Cách cấp quyền cho từng thành viên](MEMBER_PUBLISH_SETUP.md). Tin và ảnh được lưu cùng nhau. Ảnh AI được ghi rõ là ảnh minh họa, không phải ảnh chụp thật.

Mỗi lần bấm tạo ảnh sử dụng dịch vụ AI có phí. Hệ thống ưu tiên giữ ảnh đang đính kèm: tùy chọn tự tạo không tạo thêm khi bài đã có ảnh. Ảnh minh họa dựa theo loại BĐS và công năng nhận diện được, không mô phỏng chính xác căn nhà/diện tích thực tế. Dấu liên hệ/QR đi qua cơ chế đóng dấu ảnh hiện có khi hiển thị.

## Quản trị cấu hình một lần

- Viết bài dùng cấu hình chat AI đã có: `AI_PROVIDER`, `AI_MODEL` và khóa của nhà cung cấp tương ứng. Nếu đang dùng OpenRouter thì giữ nguyên `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY` và model hiện tại.
- Nếu chỉ dùng OpenAI: `AI_PROVIDER=openai`, `AI_MODEL=gpt-4o-mini`, và `OPENAI_API_KEY` hợp lệ.
- Tạo ảnh luôn cần **`OPENAI_API_KEY`**, tài khoản API có số dư và quyền dùng model ảnh. Mặc định `SOURCE_IMAGE_MODEL=gpt-image-1`; không dùng khóa OpenRouter để gọi dịch vụ ảnh này. Có ChatGPT Plus không đồng nghĩa đã có số dư API.
- Khóa nhập trong Vercel → đúng dự án → Settings → Environment Variables → Production → Save. Sửa biến đã có, không tạo trùng, không đưa khóa vào bài đăng hoặc gửi vào chat. Redeploy và chờ Ready sau khi đổi cấu hình.
- Không cần thêm bảng SQL mới: dùng kho ảnh riêng và dữ liệu bài đăng hiện có.

Nếu thiếu khóa viết bài hoặc AI trả nội dung không hợp lệ, hệ thống nói rõ đã dùng bản nháp tự động theo quy tắc. Nếu tạo ảnh lỗi, các ô đã điền vẫn được giữ; kiểm tra thông báo và thử nút tạo ảnh sau. Không tự suy đoán giá/diện tích còn thiếu, không tự gắn ảnh của người khác và không tự xuất bản bản nháp chưa được duyệt.

Code được kiểm thử bằng dịch vụ giả và trình duyệt cục bộ. Sau khi triển khai, thử một bài và một ảnh để xác nhận tài khoản API thực tế có quyền và số dư.

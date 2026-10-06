# Nội dung chữ trong admin (chống AI slop)

Đọc file này khi rà soát hoặc viết lại bất kỳ chữ nào trong giao diện: tiêu đề, nhãn, nút, toast, thông báo, số liệu mẫu.

## Mục lục
1. Nguyên tắc
2. Cái gì bị coi là slop, thay bằng gì
3. Mẫu theo từng loại chữ
4. Bảng thuật ngữ
5. Dữ liệu giả và số liệu
6. Lệnh rà soát nhanh
7. Slop về thị giác

## 1. Nguyên tắc

Người dùng admin là nhân viên đang làm việc, họ cần biết **đây là gì, tình trạng ra sao, làm gì tiếp**. Mỗi đoạn chữ chỉ làm đúng một việc đó.
Chữ nào bỏ đi mà người dùng không mất thông tin thì bỏ.

- Viết ngắn, dùng động từ + đối tượng: "Thêm khuyến mãi", "Xác nhận đơn hàng".
- Gọi tên theo cách nhân viên vận hành gọi, không theo tên field kỹ thuật (`createdAt`, `isActive`, `stockQty`).
- Một khái niệm một tên trên toàn admin.
- Câu trung tính, không xưng hô, không cảm thán. Chỉ dùng "Vui lòng" khi thật sự cần yêu cầu người dùng làm gì.
- Chữ trong nút và toast dùng cùng một động từ: nút "Lưu khuyến mãi" → toast "Đã lưu khuyến mãi".

## 2. Cái gì là slop, thay bằng gì

| Slop | Vì sao tệ | Thay bằng |
|---|---|---|
| "Chào mừng trở lại! 👋 Sẵn sàng chinh phục doanh số hôm nay?" | Không có thông tin | Bỏ. Nếu cần, "Việc cần xử lý hôm nay" kèm số cụ thể |
| Mô tả dưới tiêu đề: "Quản lý sản phẩm của bạn một cách dễ dàng và hiệu quả" | Lặp tiêu đề, khoe khoang | Bỏ, hoặc nêu phạm vi: "Sản phẩm đang bán và đã ẩn trên cửa hàng" |
| Tính từ tâng bốc: mạnh mẽ, thông minh, toàn diện, liền mạch, tối ưu, hiện đại | Không kiểm chứng được | Nói việc nó làm |
| "Có lỗi xảy ra. Vui lòng thử lại sau." | Không biết lỗi gì | "Không tải được danh sách đơn hàng. Kiểm tra kết nối rồi bấm Thử lại." |
| "Oops! Ôi không!" và xin lỗi trong lỗi | Giọng người, không giúp gì | Nói lỗi gì và cách xử lý |
| "Không có dữ liệu" | Không nói lý do, không có hướng đi | "Chưa có khuyến mãi nào. Tạo khuyến mãi đầu tiên." |
| Nút "OK", "Submit", "Xác nhận" chung chung | Không rõ sẽ xảy ra gì | Tên hành động: "Xóa sản phẩm", "Hủy đơn hàng" |
| Emoji làm icon hoặc trang trí tiêu đề (🚀 ✨ 🎉) | Trông như bản demo | Icon `lucide-react`, hoặc không cần icon |
| Dấu chấm than trong thông báo thường | Ồn ào | Dấu chấm |
| Chữ IN HOA rải rác, dấu chấm giữa "A · B · C", nhãn nhỏ phía trên mọi tiêu đề | Khuôn mẫu sinh tự động | Chữ thường, sắp xếp bằng bố cục |
| Dịch máy lủng củng: "Bạn chưa có bất kỳ đơn hàng nào để hiển thị" | Nặng nề | "Chưa có đơn hàng" |

## 3. Mẫu theo từng loại chữ

**Tiêu đề trang**: danh từ chỉ đối tượng. "Đơn hàng", "Khuyến mãi", "Nhập hàng", "Tài khoản". Trang con: "Tạo khuyến mãi", "Khuyến mãi SUMMER10".

**Nhãn cột và field**: "Mã đơn", "Khách hàng", "Tổng tiền", "Ngày tạo", "Trạng thái", "Tồn kho". Không viết hoa toàn bộ.

**Nút**: động từ + đối tượng ("Thêm sản phẩm"). Hủy luôn là "Hủy". Lưu form là "Lưu thay đổi" (sửa) hoặc "Tạo <đối tượng>" (tạo mới).

**Toast**
- Thành công: "Đã lưu khuyến mãi", "Đã hủy đơn #1042". Thì quá khứ, có đối tượng.
- Thất bại: nguyên nhân + cách xử lý. "Không lưu được khuyến mãi. Mã SUMMER10 đã tồn tại." Nếu backend trả message rõ ràng thì hiển thị message đó, không che bằng câu chung.

**Hộp xác nhận hành động phá hủy**
- Tiêu đề: "Xóa sản phẩm?"
- Nội dung: nêu tên đối tượng và hệ quả. "Sản phẩm 'Áo sơ mi Oxford' sẽ bị xóa khỏi cửa hàng. Không thể hoàn tác."
- Nút: "Hủy" và "Xóa sản phẩm" (destructive).

**Empty state**: hai câu tối đa. Câu 1 nói tình trạng, câu 2 (hoặc nút) là việc làm tiếp. Khi đang có bộ lọc: "Không có đơn hàng khớp bộ lọc" + nút "Xóa bộ lọc".

**Error state**: nói không tải được gì, kèm nút "Thử lại". Không hiển thị stack trace, mã lỗi kỹ thuật hay URL API.

**Lỗi validate form**: nói cần nhập gì, ở ngay field. "Nhập tên sản phẩm", "Giá phải lớn hơn 0", "Email không hợp lệ", "Ngày kết thúc phải sau ngày bắt đầu". Không dùng "Trường này là bắt buộc" cho mọi field.

**Trang đăng nhập**: tiêu đề "Đăng nhập quản trị". Sai thông tin: "Email hoặc mật khẩu không đúng" (không nói cái nào sai). Không khẩu hiệu.

**Trạng thái đang tải**: skeleton, không chữ "Đang tải dữ liệu, vui lòng chờ trong giây lát...". Nếu cần chữ thì "Đang tải".

## 4. Bảng thuật ngữ

Ở bước audit, lập bảng các cặp đang dùng lẫn lộn trong code rồi chọn một tên duy nhất. Ví dụ (điền theo thực tế của dự án):

| Khái niệm | Đang dùng lẫn lộn | Chọn |
|---|---|---|
| Promotion | khuyến mãi / ưu đãi / promotion / mã giảm giá | Khuyến mãi |
| Account | tài khoản / người dùng / user | Tài khoản |
| Order | đơn hàng / đơn / order | Đơn hàng |
| Purchase | nhập hàng / mua hàng / phiếu nhập | (hỏi người dùng nó là gì trong nghiệp vụ) |

Áp dụng cho tiêu đề, menu sidebar, breadcrumb, nút, toast. Không đổi tên field trong API hay type.

## 5. Dữ liệu giả và số liệu

- Không hardcode số liệu bịa vào giao diện: doanh thu, phần trăm tăng trưởng, số đơn, "+12% so với tháng trước". Mọi số phải đến từ API.
- Nếu backend chưa có endpoint cho một thẻ KPI hay biểu đồ, **bỏ thành phần đó** và báo lại người dùng, đừng dựng số giả cho đẹp.
- Không để lại `Lorem ipsum`, `John Doe`, `example@email.com`, `Product 1`, ảnh placeholder từ dịch vụ ngoài trong code giao diện.
- Placeholder trong input là ví dụ định dạng thật ("VD: SUMMER10", "0901 234 567"), không phải lặp lại nhãn.
- Dữ liệu seed (`prisma:seed`) nên giống thật (tên sản phẩm thời trang, giá hợp lý, trạng thái đa dạng) để nhìn giao diện có ý nghĩa; chỉ sửa seed khi người dùng yêu cầu.

## 6. Lệnh rà soát nhanh

Chạy từ thư mục `fashion-shop-fe`, dùng kết quả để lập danh sách sửa:

```bash
# Chữ chung chung, giọng marketing
rg -n -i "welcome|chào mừng|oops|ôi không|mạnh mẽ|thông minh|toàn diện|liền mạch|tối ưu|Lorem|John Doe" src/app/admin src/components

# Emoji trong giao diện
rg -n "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/app/admin src/components

# Thông báo chung chung
rg -n "Có lỗi xảy ra|Không có dữ liệu|Thành công!|window\.(alert|confirm)" src/app/admin src/components

# Màu hardcode và trang trí
rg -n "#[0-9a-fA-F]{3,8}\b|(bg|text|border)-(blue|gray|slate|zinc|purple|indigo|pink|violet)-[0-9]+|gradient|backdrop-blur|shadow-(xl|2xl)|rounded-(2xl|3xl)" src/app/admin src/components
```

Nếu máy không có `rg`, dùng `grep -rnE` với cùng mẫu (bỏ phần emoji).

## 7. Slop về thị giác

Những thứ này xuất hiện trên rất nhiều giao diện sinh tự động, làm admin trông như bản demo. Gỡ bỏ trừ khi có lý do nghiệp vụ:

- Nền hoặc chữ gradient, glassmorphism (`backdrop-blur`), viền phát sáng, bóng đổ lớn.
- Bo góc rất tròn (`rounded-2xl/3xl`) trên mọi thứ; thẻ lồng trong thẻ.
- Icon nằm trong ô tròn màu pastel đặt trước mỗi tiêu đề section hoặc mỗi mục menu.
- Hàng bốn thẻ KPI giống hệt nhau đặt trên mọi trang, kể cả trang không cần.
- Banner chào mừng, hình minh họa, hero trong khu vực làm việc.
- Animation vào trang (fade-up từng khối), hover phóng to thẻ.
- Badge trang trí ("Mới", "Pro", "Beta") không phản ánh trạng thái thật.
- Bảng màu tím-xanh hoặc hồng-cam mặc định. Dùng màu neutral + một màu chính + màu trạng thái (thành công, cảnh báo, lỗi, thông tin).

Nguyên tắc thay thế: cấu trúc do **khoảng trắng, căn lề và đường kẻ mảnh** tạo ra. Chỉ bọc `Card` khi cần tách một nhóm nội dung độc lập (ví dụ section của form); bảng dữ liệu tự nó có viền là đủ.
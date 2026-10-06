# Quy Chuẩn Công Thức & Chỉ Số Kinh Doanh (Analytics Metrics Documentation)

> **Tài liệu tham chiếu chuẩn xác (Single Source of Truth)**  
> **Áp dụng**: Fashion Shop v2 (Backend NestJS API & Frontend Next.js Analytics Workspace)  
> **Phiên bản**: 2.0  
> **Cập nhật lần cuối**: 02/10/2026  

---

## MỤC LỤC
1. [Nguyên Tắc Nền Tảng & Ràng Buộc Dữ Liệu](#1-nguyên-tắc-nền-tảng--ràng-buộc-dữ-liệu)
2. [Bảng Tra Cứu Nhanh Tất Cả Các Chỉ Số (Quick Reference Cheat Sheet)](#2-bảng-tra-cứu-nhanh-tất-cả-các-chỉ-số-quick-reference-cheat-sheet)
3. [Công Thức Xác Định Chu Kỳ Thời Gian (Date Ranges & Comparison)](#3-công-thức-xác-định-chu-kỳ-thời-gian-date-ranges--comparison)
4. [Khối 4 Thẻ KPI Cốt Lõi (Core KPI Cards)](#4-khối-4-thẻ-kpi-cốt-lõi-core-kpi-cards)
5. [Khối Biểu Đồ Diễn Biến Doanh Số (Sales Performance Chart)](#5-khối-biểu-đồ-diễn-biến-doanh-số-sales-performance-chart)
6. [Khối Động Cơ Cảnh Báo Vận Hành (Business Insights Rule Engine)](#6-khối-động-cơ-cảnh-báo-vận-hành-business-insights-rule-engine)
7. [Khối Hiệu Suất Sản Phẩm (Product Performance & Quick Drawer)](#7-khối-hiệu-suất-sản-phẩm-product-performance--quick-drawer)
8. [Khối Hiệu Suất Khuyến Mãi (Promotion Performance & Campaign Grouping)](#8-khối-hiệu-suất-khuyến-mãi-promotion-performance--campaign-grouping)
9. [Khối Cơ Cấu Doanh Số Ngành Hàng (Category Performance)](#9-khối-cơ-cấu-doanh-số-ngành-hàng-category-performance)
10. [Khối Tín Hiệu Sức Khỏe Kho (Inventory Signals)](#10-khối-tín-hiệu-sức-khỏe-kho-inventory-signals)
11. [Quy Chuẩn Định Dạng Hiển Thị (Display & Formatting Standards)](#11-quy-chuẩn-định-dạng-hiển-thị-display--formatting-standards)
12. [Các Chỉ Số Bị Loại Trừ Khỏi MVP (Excluded Metrics)](#12-các-chỉ-số-bị-loại-trừ-khỏi-mvp-excluded-metrics)

---

## 1. Nguyên Tắc Nền Tảng & Ràng Buộc Dữ Liệu

1. **Điều kiện ghi nhận giao dịch hợp lệ (Valid Sales)**:
   - Chỉ các đơn hàng có trạng thái **`COMPLETED`** mới được ghi nhận vào doanh thu và sản lượng bán:
     ```sql
     WHERE order.status = 'COMPLETED'
     ```
   - Các đơn hàng `CANCELLED` bị loại trừ hoàn toàn khỏi mọi báo cáo tài chính.
   - Các đơn hàng `PENDING`, `CONFIRMED`, `SHIPPING` chưa hoàn tất chu trình giao nhận nên chưa ghi nhận doanh thu thực thu.

2. **Vai trò độc lập của Chiến dịch (Campaign)**:
   - `Campaign` **chỉ là một chiều phân loại báo cáo (Grouping Dimension)** cho `Discount` (giảm giá sản phẩm) và `Voucher` (giảm giá đơn hàng).
   - `Campaign` **không** lưu số tiền thanh toán thực tế. Dữ liệu tài chính phát sinh thực tế nằm ở:
     - `orders` (`subtotal`, `product_discount`, `voucher_discount`, `total`)
     - `order_items` (`quantity`, `original_unit_price`, `product_discount`, `final_unit_price`)
     - `discount_applications` (`discount_amount`, `discount_id`, `order_item_id`)
     - `voucher_applications` (`discount_amount`, `voucher_id`, `order_id`)
   - Mọi chương trình không liên kết `campaign_id` được gom vào: `"Không gắn chiến dịch (Direct Promotions)"`.

3. **Tổng hợp dữ liệu tại Database (Database-level Aggregation)**:
   - Không kéo dữ liệu thô hàng nghìn đơn hàng về client. Toàn bộ phép tính `SUM`, `COUNT`, `GROUP BY` được thực hiện trực tiếp trên PostgreSQL thông qua Prisma/SQL tối ưu.

---

## 2. Bảng Tra Cứu Nhanh Tất Cả Các Chỉ Số (Quick Reference Cheat Sheet)

| Tên chỉ số (UI) | Mã API | Nguồn dữ liệu (Bảng / Trường) | Công thức tóm tắt | Đơn vị / Định dạng |
|---|---|---|---|---|
| **Doanh thu thuần** | `netSales` | `orders.total` | $\sum \text{total}$ (đơn `COMPLETED`) | Tiền tệ (`485.200.000 đ`) |
| **Đơn hàng hoàn tất** | `orders` | `orders.id` | $\text{COUNT}(\text{id})$ (đơn `COMPLETED`) | Số nguyên (`1.420 đơn`) |
| **Sản phẩm đã bán** | `unitsSold` | `order_items.quantity` | $\sum \text{quantity}$ (đơn `COMPLETED`) | Số nguyên (`3.120 sp`) |
| **Giá trị trung bình đơn** | `aov` | Phép chia | $\text{Net Sales} / \text{Orders}$ | Tiền tệ (`341.700 đ`) |
| **Doanh thu gộp** | `grossSales` | `orders.subtotal` | $\sum \text{subtotal}$ (đơn `COMPLETED`) | Tiền tệ (`520.000.000 đ`) |
| **Chi phí chiết khấu** | `discountCost` | `orders.product_discount + orders.voucher_discount` | $\sum (\text{product\_discount} + \text{voucher\_discount})$ | Tiền tệ (`34.800.000 đ`) |
| **Tỷ lệ tăng trưởng** | `deltaPercent` | So sánh kỳ | $((\text{Current} - \text{Previous}) / \text{Previous}) \times 100$ | Phần trăm (`+12.4%`, `-8.2%`) |
| **Doanh thu sản phẩm** | `productRevenue` | `order_items.final_unit_price * quantity` | $\sum (\text{final\_unit\_price} \times \text{quantity})$ | Tiền tệ |
| **Chiết khấu sản phẩm** | `productDiscount` | `order_items.product_discount * quantity` | $\sum (\text{product\_discount} \times \text{quantity})$ | Tiền tệ |
| **Doanh thu có KM** | `promoRevenue` | `orders.total` | $\sum \text{total}$ (đơn có Discount/Voucher App) | Tiền tệ |
| **Tỷ trọng danh mục** | `categoryPercentage` | Phép chia | $(\text{Category Revenue} / \text{Total Category Revenue}) \times 100$ | Phần trăm (`38.5%`) |
| **SKU hết hàng** | `outOfStockCount` | `product_variants.stock` | $\text{COUNT}(\text{id})$ WHERE $\text{stock} = 0$ | Số lượng SKU |
| **SKU sắp hết hàng** | `lowStockCount` | `product_variants.stock` | $\text{COUNT}(\text{id})$ WHERE $0 < \text{stock} \le 5$ | Số lượng SKU |
| **SKU chậm luân chuyển** | `slowMovingCount` | `product_variants` & `order_items` | $\text{stock} \ge 10$ VÀ $\text{unitsSold(kỳ)} \le 1$ | Số lượng SKU |

---

## 3. Công Thức Xác Định Chu Kỳ Thời Gian (Date Ranges & Comparison)

### 3.1 Các Lựa Chọn Khoảng Thời Gian (Presets)
Gọi thời điểm hiện tại là $T_{\text{now}}$:
- **7 ngày qua (`last7days`)**:  
  - $T_{\text{from}} = T_{\text{now}} - 7 \text{ ngày}$
  - $T_{\text{to}} = T_{\text{now}}$
- **30 ngày qua (`last30days`)** *(Mặc định)*:  
  - $T_{\text{from}} = T_{\text{now}} - 30 \text{ ngày}$
  - $T_{\text{to}} = T_{\text{now}}$
- **Tháng này (`thisMonth`)**:  
  - $T_{\text{from}} = \text{00:00:00 ngày đầu tiên của tháng hiện tại}$
  - $T_{\text{to}} = T_{\text{now}}$
- **Tháng trước (`lastMonth`)**:  
  - $T_{\text{from}} = \text{00:00:00 ngày đầu tiên của tháng liền trước}$
  - $T_{\text{to}} = \text{23:59:59 ngày cuối cùng của tháng liền trước}$
- **Tùy chọn (`custom`)**:  
  - $T_{\text{from}} = \text{00:00:00 của ngày bắt đầu được chọn}$
  - $T_{\text{to}} = \text{23:59:59 của ngày kết thúc được chọn}$

### 3.2 Chu Kỳ So Sánh Liền Trước (Previous Period)
Để đảm bảo tính đối soát công bằng, chu kỳ so sánh luôn có **độ dài đúng bằng $N$ ngày** của chu kỳ hiện tại và nằm ngay liền kề trước đó:
$$\text{Duration } D = T_{\text{to}} - T_{\text{from}}$$
$$\text{Previous To } = T_{\text{from}}$$
$$\text{Previous From } = T_{\text{from}} - D$$

*Ví dụ:* Chu kỳ hiện tại từ `01/09/2026` đến `30/09/2026` ($D = 30$ ngày) $\rightarrow$ Chu kỳ so sánh là từ `02/08/2026` đến `01/09/2026`.

### 3.3 Công Thức Tính Tỷ Lệ Tăng Trưởng Phần Trăm ($\Delta\%$)
$$\Delta\% = \begin{cases} 
\frac{\text{Current} - \text{Previous}}{\text{Previous}} \times 100\% & \text{khi } \text{Previous} > 0 \\ 
+100\% & \text{khi } \text{Previous} = 0 \text{ và } \text{Current} > 0 \\ 
-100\% & \text{khi } \text{Previous} = 0 \text{ và } \text{Current} < 0 \\ 
0\% & \text{khi } \text{Previous} = 0 \text{ và } \text{Current} = 0 
\end{cases}$$
- Làm tròn hiển thị: **1 chữ số thập phân** (ví dụ: `+12.4%`, `-8.0%`).
- Màu ngữ nghĩa: $\Delta\% > 0$ hiển thị xanh lá cây (`success`), $\Delta\% < 0$ hiển thị đỏ (`destructive`).

---

## 4. Khối 4 Thẻ KPI Cốt Lõi (Core KPI Cards)

### 4.1 Doanh Thu Thuần (Net Sales)
- **Định nghĩa**: Tổng số tiền thực thu sau khi đã trừ toàn bộ chiết khấu sản phẩm và voucher giảm giá trên đơn hàng.
- **Toán học**:
  $$\text{Net Sales} = \sum_{i=1}^{M} \text{Order}_i.\text{total} \quad (\forall i \in \text{Orders}: \text{status} = \text{'COMPLETED'})$$
- **SQL**:
  ```sql
  SELECT COALESCE(SUM(total), 0) AS net_sales
  FROM orders
  WHERE status = 'COMPLETED'
    AND created_at >= :from AND created_at <= :to;
  ```

### 4.2 Đơn Hàng Hoàn Tất (Completed Orders)
- **Định nghĩa**: Tổng số đơn hàng được xử lý và giao dịch thành công trong kỳ.
- **Toán học**:
  $$\text{Orders} = \text{COUNT}(\{ \text{Order}_i \mid \text{Order}_i.\text{status} = \text{'COMPLETED'} \})$$
- **SQL**:
  ```sql
  SELECT COUNT(id) AS orders_count
  FROM orders
  WHERE status = 'COMPLETED'
    AND created_at >= :from AND created_at <= :to;
  ```

### 4.3 Sản Phẩm Đã Bán (Units Sold)
- **Định nghĩa**: Tổng số lượng đơn vị sản phẩm (pieces/items) rời kho từ các đơn hàng hoàn tất.
- **Toán học**:
  $$\text{Units Sold} = \sum_{j=1}^{K} \text{OrderItem}_j.\text{quantity} \quad (\forall j \in \text{OrderItems}: \text{Order}_j.\text{status} = \text{'COMPLETED'})$$
- **SQL**:
  ```sql
  SELECT COALESCE(SUM(oi.quantity), 0) AS units_sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'COMPLETED'
    AND o.created_at >= :from AND o.created_at <= :to;
  ```

### 4.4 Giá Trị Trung Bình Đơn Hàng (Average Order Value - AOV)
- **Định nghĩa**: Mức chi tiêu trung bình của một đơn hàng thành công.
- **Toán học**:
  $$\text{AOV} = \begin{cases} \frac{\text{Net Sales}}{\text{Orders}} & \text{khi } \text{Orders} > 0 \\ 0 & \text{khi } \text{Orders} = 0 \end{cases}$$
- **Quy tắc làm tròn**: Làm tròn đến hàng đơn vị đồng (`Math.round`).

### 4.5 Thuật Toán Dựng Sparkline SVG Mini Trên Thẻ KPI
Mỗi thẻ KPI hiển thị một biểu đồ đường mini (Sparkline) biểu diễn diễn biến qua từng ngày trong chu kỳ:
- Danh sách giá trị theo ngày: $V = [v_1, v_2, \dots, v_n]$
- Giá trị cực tiểu $v_{\min} = \min(V)$, cực đại $v_{\max} = \max(V)$, khoảng biến thiên $R = \max(1, v_{\max} - v_{\min})$
- Kích thước khung vẽ: Chiều rộng $W = 200$, Chiều cao $H = 40$, Lề đệm $P = 3$
- Tọa độ điểm thứ $i$ ($0$-indexed):
  $$x_i = P + \frac{i}{n - 1} \times (W - 2P)$$
  $$y_i = H - P - \frac{v_i - v_{\min}}{R} \times (H - 2P)$$
- Đường dẫn SVG: `M x_0,y_0 L x_1,y_1 ... L x_{n-1},y_{n-1}`.

---

## 5. Khối Biểu Đồ Diễn Biến Doanh Số (Sales Performance Chart)

- **Phân bổ theo ngày (Daily Bucketing)**:
  Với mỗi ngày $d \in [T_{\text{from}}, T_{\text{to}}]$ theo định dạng `YYYY-MM-DD`:
  - $\text{Revenue}(d) = \sum \text{Order.total}$ phát sinh trong ngày $d$.
  - $\text{Orders}(d) = \text{COUNT}(\text{Order.id})$ phát sinh trong ngày $d$.
  - $\text{Units}(d) = \sum \text{OrderItem.quantity}$ phát sinh trong ngày $d$.
- **Đối soát song song chu kỳ trước**:
  Ngày thứ $k$ của kỳ hiện tại được gióng hàng cùng ngày thứ $k$ của chu kỳ trước:
  $$\text{Point}_k = \{ \text{date}: d_k, \text{current}: \text{Metric}(d_k), \text{previous}: \text{Metric}(d^{\text{prev}}_k) \}$$
  - Đường nét liền (Solid Area/Line): Dữ liệu kỳ hiện tại.
  - Đường nét đứt (Dashed Line): Dữ liệu chu kỳ liền trước.

---

## 6. Khối Động Cơ Cảnh Báo Vận Hành (Business Insights Rule Engine)

Hệ thống chạy 4 quy tắc phân tích tự động dựa trên số liệu thực tế để đưa ra cảnh báo kèm hành động khắc phục:

### Quy Tắc 1: Cảnh Báo Sụt Giảm Doanh Thu (Revenue Drop Alert)
- **Điều kiện kích hoạt**:
  $$\text{Sales Delta } \Delta\% \le -15\% \quad \text{VÀ} \quad \text{Previous Sales} > 0$$
- **Thuật toán tìm bằng chứng (Evidence)**:
  1. Với mỗi sản phẩm $p$, tính độ giảm doanh số tuyệt đối:
     $$\text{Loss}(p) = \text{Revenue}_{\text{prev}}(p) - \text{Revenue}_{\text{curr}}(p)$$
  2. Sắp xếp giảm dần theo $\text{Loss}(p)$ và trích xuất top 2 sản phẩm có mức giảm mạnh nhất.
- **Hành động (CTA)**: "Kiểm tra sản phẩm" $\rightarrow$ `/admin/products`.

### Quy Tắc 2: Cảnh Báo Đứt Gãy Nguồn Cung Biến Thể Bán Chạy (Stockout Velocity Alert)
- **Điều kiện kích hoạt**:
  $$\text{ProductVariant.stock} = 0 \quad \text{VÀ} \quad \text{Units Sold trong kỳ} \ge 2$$
- **Ý nghĩa**: Biến thể đang có sức mua tốt nhưng đã cạn tồn kho, gây thất thoát doanh thu tiềm năng.
- **Hành động (CTA)**: "Tạo phiếu nhập hàng" $\rightarrow$ `/admin/purchase`.

### Quy Tắc 3: Cảnh Báo Tỷ Lệ Chiết Khấu Cao Bất Thường (High Discount Exposure)
- **Điều kiện kích hoạt**:
  $$\text{Discount Exposure Ratio} = \left( \frac{\text{Discount Cost}}{\text{Gross Sales}} \right) \times 100\% \ge 25\%$$
- **Ý nghĩa**: Chi phí khuyến mãi chiếm trên 1/4 tổng giá trị niêm yết, có nguy cơ gây thâm hụt biên lợi nhuận ròng.
- **Hành động (CTA)**: "Rà soát khuyến mãi" $\rightarrow$ `/admin/promotions`.

### Quy Tắc 4: Cảnh Báo Chạm Trần Ngân Sách Chiến Dịch (Campaign Budget Exhaustion)
- **Điều kiện kích hoạt**:
  $$\text{Budget Usage Ratio} = \left( \frac{\text{Campaign.spentAmount}}{\text{Campaign.budgetLimit}} \right) \times 100\% \ge 85\%$$
- **Ý nghĩa**: Chiến dịch sắp hết ngân sách được cấp, cần nới hạn mức hoặc chuẩn bị kết thúc chương trình.
- **Hành động (CTA)**: "Quản lý chiến dịch" $\rightarrow$ `/admin/promotions`.

---

## 7. Khối Hiệu Suất Sản Phẩm (Product Performance & Quick Drawer)

### 7.1 Chỉ Số Từng Sản Phẩm Trong Kỳ
- **Doanh thu đóng góp (Product Revenue)**:
  $$\text{Revenue}(p) = \sum_{m \in \text{Items of } p} (\text{OrderItem}_m.\text{finalUnitPrice} \times \text{OrderItem}_m.\text{quantity})$$
- **Số lượng đã bán (Units Sold)**:
  $$\text{Units}(p) = \sum_{m \in \text{Items of } p} \text{OrderItem}_m.\text{quantity}$$
- **Số đơn hàng chứa sản phẩm (Orders Count)**:
  $$\text{Orders}(p) = \text{COUNT}(\text{DISTINCT } \text{OrderItem}_m.\text{orderId})$$
- **Tổng chiết khấu sản phẩm đã hưởng (Discount Absorbed)**:
  $$\text{Discount}(p) = \sum_{m \in \text{Items of } p} (\text{OrderItem}_m.\text{productDiscount} \times \text{OrderItem}_m.\text{quantity})$$
- **Tăng trưởng xu hướng (Trend %)**:
  $$\text{Trend}(p) = \frac{\text{Revenue}_{\text{curr}}(p) - \text{Revenue}_{\text{prev}}(p)}{\max(1, \text{Revenue}_{\text{prev}}(p))} \times 100\%$$

### 7.2 Phân Rã Theo Biến Thể (Trong Quick Drawer)
Khi người dùng bấm vào một dòng sản phẩm, Drawer hiển thị chi tiết theo từng biến thể (SKU, Size, Color):
- $\text{Variant Revenue} = \sum (\text{finalUnitPrice} \times \text{quantity})$
- $\text{Variant Units} = \sum \text{quantity}$
- $\text{Variant Stock} = \text{ProductVariant.stock}$

---

## 8. Khối Hiệu Suất Khuyến Mãi (Promotion Performance & Campaign Grouping)

### 8.1 Thống Kê Tổng Hợp Khuyến Mãi
- **Doanh thu gắn với Khuyến mãi (Promotion Driven Revenue)**:
  Tổng `Order.total` của các đơn hàng có áp dụng ít nhất 1 chương trình:
  $$\text{Promo Revenue} = \sum \text{Order.total} \quad (\text{Order có DiscountApplication HOẶC VoucherApplication})$$
- **Tổng chi phí khuyến mãi (Total Discount Cost)**:
  $$\text{Total Discount Cost} = \sum \text{DiscountApplication.discountAmount} + \sum \text{VoucherApplication.discountAmount}$$
- **Số đơn áp dụng khuyến mãi (Promotion Orders Count)**:
  Số lượng đơn hàng duy nhất có áp dụng mã giảm giá hoặc voucher:
  $$\text{Promotion Orders} = \text{COUNT}(\text{DISTINCT } \text{orderId})$$

### 8.2 Quy Tắc Gom Nhóm Theo Chiến Dịch (Campaign Grouping Logic)
1. **Nếu Discount hoặc Voucher có `campaign_id`**:
   - Ghi nhận chi phí `discountAmount` vào Campaign tương ứng.
   - Ghi nhận `order.total` vào doanh thu thúc đẩy của Campaign đó.
   - Đưa chương trình vào danh sách con `subItems` của Campaign.
2. **Nếu Discount hoặc Voucher không có `campaign_id` (`null`)**:
   - Tách thành một dòng độc lập trên bảng với nhãn loại là `"Giảm giá SP"` hoặc `"Voucher"`.
   - Không gộp cưỡng bức vào bất kỳ campaign nào.

---

## 9. Khối Cơ Cấu Doanh Số Ngành Hàng (Category Performance)

- **Doanh thu danh mục (Category Revenue)**:
  Tổng doanh số các OrderItem có sản phẩm thuộc danh mục $C$:
  $$\text{Revenue}(C) = \sum_{j \in \text{Items of } C} (\text{OrderItem}_j.\text{finalUnitPrice} \times \text{OrderItem}_j.\text{quantity})$$
- **Tỷ trọng đóng góp (% Share)**:
  $$\text{Share}(C) = \frac{\text{Revenue}(C)}{\sum_{\text{all } k} \text{Revenue}(C_k)} \times 100\%$$
- **Quy tắc hiển thị**:
  Sắp xếp giảm dần theo doanh thu; thanh tiến độ (progress bar) trực quan tỷ lệ % đóng góp.

---

## 10. Khối Tín Hiệu Sức Khỏe Kho (Inventory Signals)

Đánh giá trạng thái tồn kho của từng biến thể thời trang (`ProductVariant`):

1. **Biến thể hết hàng (Out of Stock)**:
   $$\text{ProductVariant.stock} = 0$$
   *Ý nghĩa: Mất khả năng bán hàng ngay lập tức.*

2. **Biến thể sắp hết hàng (Low Stock)**:
   $$1 \le \text{ProductVariant.stock} \le 5$$
   *Ý nghĩa: Chạm ngưỡng tồn kho an toàn, cần chuẩn bị đơn mua hàng mới.*

3. **Biến thể tồn kho chậm luân chuyển (Slow Moving)**:
   $$\text{ProductVariant.stock} \ge 10 \quad \text{VÀ} \quad \text{Units Sold trong kỳ} \le 1$$
   *Ý nghĩa: Đọng vốn trong kho, cần cân nhắc đưa vào các đợt Flash Sale hoặc xả hàng tồn.*

---

## 11. Quy Chuẩn Định Dạng Hiển Thị (Display & Formatting Standards)

Nhằm đảm bảo giao diện đồng bộ, dễ quét mắt và không gây hiểu nhầm số liệu:

1. **Định dạng tiền tệ (`formatCurrency`)**:
   - Đơn vị: Đồng Việt Nam (VND).
   - Quy cách: Dấu chấm `.` phân cách hàng nghìn, không hiển thị số thập phân, ký hiệu tiền tệ ở cuối.
   - Ví dụ: `485.200.000 đ`.

2. **Định dạng số đếm (`formatNumber`)**:
   - Sử dụng dấu chấm `.` phân cách hàng nghìn.
   - Ví dụ: `1.420`, `10.500`.

3. **Định dạng tỷ lệ tăng trưởng ($\Delta\%$)**:
   - Luôn kèm dấu `+` đối với số dương.
   - Làm tròn 1 chữ số thập phân.
   - Ví dụ: `+12.4%`, `-5.1%`, `0.0%`.

4. **Định dạng ngày tháng trên biểu đồ (`formatDate`)**:
   - Trục hoành $X$: `DD/MM` (ví dụ: `15/09`).
   - Tooltip chi tiết: `DD/MM/YYYY` (ví dụ: `15/09/2026`).

---

## 12. Các Chỉ Số Bị Loại Trừ Khỏi MVP (Excluded Metrics)

Để đảm bảo tính trung thực tuyệt đối của dữ liệu và tuân thủ nguyên tắc chống số liệu giả (Anti AI-slop):

1. **Tỷ Lệ Chuyển Đổi (Conversion Rate - CR)**:
   - *Lý do loại trừ*: Hệ thống hiện tại chưa có module phân tích web traffic (Google Analytics / PostHog) để thu thập lượt truy cập phiên (Sessions/Visitors) độc lập. Không bịa đặt số lượt xem để tính CR.

2. **Chi Phí Tiếp Thị Cho Mỗi Khách Hàng (Customer Acquisition Cost - CAC)**:
   - *Lý do loại trừ*: Chưa có API kết nối tự động với tài khoản quảng cáo (Meta Ads, Google Ads, TikTok Ads) để phân bổ chi phí quảng bá theo từng khách hàng.

3. **Lợi Nhuận Gộp Quá Khứ Chính Xác (Historical Gross Profit Margin)**:
   - *Lý do loại trừ*: Bảng `order_items` lưu giá bán thực tế (`finalUnitPrice`), nhưng chưa có snapshot giá vốn tại đúng thời điểm khách chốt đơn (chỉ có `costPrice` trên phiếu nhập `purchase_receipt_items`). Việc ước tính margin sẽ làm sai lệch báo cáo kế toán.

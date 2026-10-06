---
name: improve-admin-ui
description: >-
  Quy trình cải thiện giao diện trang quản trị (admin) của Next.js frontend theo chuẩn doanh nghiệp:
  design tokens, layout shell, bảng dữ liệu, form, dashboard, trạng thái loading/empty/error, accessibility, dark mode.
  Bao gồm cả việc viết lại nội dung chữ (tiêu đề, nhãn, thông báo, empty/error state) để loại bỏ văn phong
  và trang trí kiểu AI sinh tự động (AI slop), cùng bố cục cho từng trang admin (orders, products, promotions,
  purchase, accounts, analytics, login).
  Sử dụng khi người dùng nhắc đến admin, dashboard, trang quản trị, quản lý đơn hàng/sản phẩm/khách hàng,
  bảng dữ liệu, sidebar, form quản lý, nội dung/copy trong admin, AI slop, hoặc yêu cầu "làm đẹp",
  "chuyên nghiệp hơn", "chuẩn enterprise", "đồng bộ giao diện" cho khu vực admin — kể cả khi họ không nói
  rõ chữ "enterprise".
---

# Improve Admin UI (Enterprise Standard)

Admin của doanh nghiệp được dùng hàng giờ mỗi ngày bởi nhân viên vận hành. Vì vậy mục tiêu là
**nhất quán, dễ quét mắt, ít lỗi thao tác, đọc được nhiều dữ liệu**, không phải gây ấn tượng thị giác.
Khi skill này và skill `frontend-design` cùng khớp, **skill này được ưu tiên** cho khu vực admin:
không thêm gradient trang trí, animation vào trang, hay bố cục "độc đáo". Chỉ mượn từ `frontend-design`
phần chất lượng nền (focus rõ, contrast, reduced motion, responsive).

## Ràng buộc của dự án (đọc trước khi code)

- Stack: Next.js 15 App Router, React 19, Tailwind **v3** (cấu hình qua `tailwind.config`, không phải v4),
  Radix UI, React Hook Form + Zod v4, TanStack Query v5, Zustand, Recharts v3, Sonner, next-themes, lucide-react.
- `AGENTS.md`: **KHÔNG thêm dependency mới khi chưa discuss với team.** Xem mục "Khoảng trống thư viện" bên dưới.
- Tên file component PascalCase, page là `page.tsx`/`layout.tsx`, service là `<feature>.service.ts`, type ở `src/types/`.
- Code phải qua Prettier, TypeScript strict, không dùng `any`.
- Chỉ đổi giao diện và hành vi UI. **Không đổi API contract, business logic hay backend.**

## Chống AI slop (nội dung và thị giác)

"AI slop" là chữ và giao diện nhìn qua là biết sinh tự động: chung chung, tâng bốc, số liệu bịa, trang trí thừa.
Nó làm admin kém đáng tin vì nhân viên phải đọc nhiều mà không biết làm gì tiếp. Áp dụng ở **mọi** bước bên dưới,
không phải một bước riêng.

**Nội dung chữ**
- Mỗi đoạn chữ phải giúp người dùng biết: đây là gì, tình trạng ra sao, làm gì tiếp. Bỏ chữ nào không thêm thông tin.
- Không lời chào marketing, không tính từ tâng bốc (mạnh mẽ, thông minh, toàn diện, liền mạch), không emoji, không "Oops!".
- Mô tả dưới tiêu đề trang chỉ giữ khi nêu phạm vi hoặc quy tắc thật; nếu chỉ lặp lại tiêu đề thì xóa.
- Nút và toast đặt tên theo hành động cụ thể ("Xóa sản phẩm" → "Đã xóa sản phẩm"), không dùng "OK/Submit/Xác nhận" chung chung.
- Lỗi nói rõ chuyện gì xảy ra và cách xử lý. Empty state nói lý do và bước tiếp theo.
- Nhãn dùng thuật ngữ nghiệp vụ, không dùng tên field kỹ thuật; một khái niệm một tên trên toàn admin.
- **Không dựng số liệu giả.** KPI, phần trăm tăng trưởng, biểu đồ phải đến từ API. Backend chưa có thì bỏ thành phần đó và báo người dùng.

**Thị giác**
- Bỏ gradient, glassmorphism, bóng đổ lớn, bo góc quá tròn, thẻ lồng thẻ, icon trong ô tròn màu, banner chào mừng,
  animation vào trang, badge trang trí.
- Cấu trúc do khoảng trắng, căn lề và đường kẻ mảnh tạo ra. Chỉ dùng `Card` để tách nhóm nội dung độc lập.
- Không thêm hàng thẻ KPI hay biểu đồ chỉ để trang trông đầy.

Ví dụ nhanh:

| Trước | Sau |
|---|---|
| "Chào mừng trở lại! 🚀 Quản lý cửa hàng của bạn thật dễ dàng." | Tiêu đề "Tổng quan" và danh sách "Việc cần xử lý" |
| "Có lỗi xảy ra. Vui lòng thử lại sau." | "Không tải được danh sách đơn hàng. Kiểm tra kết nối rồi bấm Thử lại." |
| "Không có dữ liệu" | "Chưa có khuyến mãi nào. Tạo khuyến mãi đầu tiên." |
| Nút "Submit" | "Lưu thay đổi" |

Bảng thay thế đầy đủ, mẫu chữ theo từng loại và lệnh `rg` để quét nhanh nằm trong
`references/content-guidelines.md`. Đọc file đó khi rà soát hoặc viết lại chữ trong giao diện.

## Bản đồ trang admin

Admin hiện có các route: `page.tsx` (tổng quan), `analytics`, `orders`, `products`, `promotions`
(kèm `create` và `[id]`), `purchase`, `accounts`, `login` và `layout.tsx`. Bố cục đích, cột gợi ý và lưu ý riêng
của từng trang nằm trong `references/admin-pages.md`. **Đọc mục của trang trước khi sửa trang đó.**

## Quy trình

### Bước 0. Audit hiện trạng (bắt buộc, làm trước khi sửa)

Trước hết chạy `git status` và `git diff --stat`. Các trang admin có thể đang sửa dở (chưa commit); không ghi đè
công việc chưa commit khi chưa hỏi người dùng. Nếu đang ở `main` hoặc `develop`, tạo nhánh
`feature/admin-ui-refresh` (AGENTS.md cấm commit trực tiếp vào hai nhánh này).

Sau đó đọc và ghi chú ngắn cho người dùng:
- `fashion-shop-fe/tailwind.config.*`, `src/app/globals.css`, `src/app/layout.tsx` (font, ThemeProvider, Toaster)
- `src/components/ui/` đã có primitive nào; `src/components/` có component dùng chung nào
- `src/app/admin/layout.tsx` (cơ chế guard, có bao cả `/admin/login` không) và 1–2 trang tiêu biểu
- Nội dung chữ hiện có: chạy các lệnh quét trong `references/content-guidelines.md` (mục 6), gom tiêu đề, nhãn cột,
  nút, toast, empty/error message, số liệu mẫu; lập bảng thuật ngữ đang dùng lẫn lộn
- Các `page.tsx` quá lớn (chứa cả bảng, form, gọi API) cần tách component theo mục "Cách làm việc"
- Ngôn ngữ UI đang dùng (giữ nhất quán; nếu chưa có thì mặc định tiếng Việt), đơn vị tiền tệ, định dạng ngày
- Màu thương hiệu hiện có (giữ lại làm `--primary`, không tự đổi)

Sau đó nêu 3–7 vấn đề lớn nhất tìm thấy (ví dụ: màu hardcode, mỗi bảng một kiểu, thiếu empty state) và
đề xuất thứ tự làm. Nếu người dùng chỉ định một trang/feature cụ thể thì chỉ làm phạm vi đó.

### Bước 1. Design tokens

Dùng biến CSS ngữ nghĩa để đổi theme ở một chỗ và dark mode hoạt động tự động. Không viết hex hay
`bg-blue-500`, `text-gray-600` trực tiếp trong component admin.

```css
/* src/app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 40%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;
    --primary: 221 83% 53%;          /* thay bằng màu brand hiện có nếu có */
    --primary-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --success: 142 71% 30%;
    --warning: 32 95% 40%;
    --info: 199 89% 40%;
  }
  .dark {
    --background: 222 47% 7%;
    --foreground: 210 40% 96%;
    --card: 222 47% 10%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 20%;
    --input: 217 33% 20%;
    --ring: 217 91% 60%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 7%;
    --destructive: 0 84% 60%;
    --success: 142 69% 50%;
    --warning: 38 92% 55%;
    --info: 199 89% 60%;
  }
  body { @apply bg-background text-foreground antialiased; }
}
```

Trong Tailwind v3, khai báo màu với `<alpha-value>` để các modifier như `bg-success/10` hoạt động:

```ts
// tailwind.config.ts → theme.extend.colors
success: 'hsl(var(--success) / <alpha-value>)',
warning: 'hsl(var(--warning) / <alpha-value>)',
info: 'hsl(var(--info) / <alpha-value>)',
// tương tự cho background, foreground, card, muted, border, primary, destructive...
```

Thang kích thước (dùng nhất quán, không tự đặt số mới):

| Thành phần | Class |
|---|---|
| Tiêu đề trang | `text-2xl font-semibold tracking-tight` |
| Tiêu đề section/card | `text-lg font-semibold` |
| Nội dung, bảng, form | `text-sm` |
| Chú thích, metadata | `text-xs text-muted-foreground` |
| Số liệu trong bảng/KPI | thêm `tabular-nums`, căn phải |

Font: một họ sans duy nhất qua `next/font`, **bắt buộc có subset `vietnamese`** để dấu không bị fallback:

```ts
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
```

Khoảng cách theo thang 4px của Tailwind: `gap-2/4/6`, padding card `p-4` hoặc `p-6`, khoảng cách giữa các
khối trang `space-y-6`. Bo góc thống nhất `rounded-md` cho control, `rounded-lg` cho card.

### Bước 2. Component dùng chung

Ưu tiên tái sử dụng những gì đã có trong `src/components/ui/`. Chỉ tạo thêm khi thiếu, theo cấu trúc:

```
fashion-shop-fe/src/components/
├── ui/                      # Primitive: Button, Input, Badge, Card, Table, Skeleton, Dialog, Select, Tabs, Label
├── admin/
│   ├── AdminShell.tsx       # Sidebar + Topbar + content
│   ├── AdminSidebar.tsx
│   ├── AdminTopbar.tsx      # Breadcrumb, đổi theme, menu người dùng
│   └── PageHeader.tsx       # Tiêu đề + mô tả + nút hành động chính
└── shared/
    ├── DataTable.tsx        # Bảng chuẩn (xem Bước 4)
    ├── TablePagination.tsx
    ├── FilterToolbar.tsx
    ├── StatusBadge.tsx
    ├── EmptyState.tsx
    ├── ErrorState.tsx       # Có nút "Thử lại"
    ├── ConfirmDialog.tsx    # Dựa trên @radix-ui/react-dialog
    ├── FormField.tsx        # Label + control + lỗi + mô tả
    └── StatCard.tsx         # KPI cho dashboard
```

Helper định dạng đặt ở `src/lib/format.ts` (thuần hàm, dễ test bằng Vitest):

```ts
export const formatCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(d));

export const formatDateTime = (d: string | Date) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d));
```

`StatusBadge` map trạng thái nghiệp vụ sang token, **luôn kèm chữ** (không chỉ dựa vào màu) để người mù màu vẫn đọc được:

```tsx
const STATUS_STYLES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  danger: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
} as const;

// Map ở một nơi duy nhất cho mỗi domain, ví dụ:
// PENDING → warning "Chờ xác nhận", SHIPPING → info "Đang giao", COMPLETED → success "Hoàn thành", CANCELLED → neutral "Đã hủy"
```

### Bước 3. Layout shell

- Sidebar cố định bên trái: rộng 240px, thu gọn còn 64px (chỉ icon, có `aria-label`). Nhóm menu theo chức năng
  (Tổng quan, Bán hàng, Danh mục, Hệ thống), mục đang mở dùng `aria-current="page"` và nền `bg-muted`.
- Dưới `lg`: sidebar chuyển thành drawer dựng bằng `@radix-ui/react-dialog`, mở bằng nút menu ở topbar.
- Topbar: nút mở sidebar, breadcrumb, nút đổi theme (`next-themes`), menu người dùng (tên, vai trò, đăng xuất).
- Vùng nội dung: `mx-auto w-full max-w-screen-2xl px-4 py-6 lg:px-8`, mỗi trang bắt đầu bằng `PageHeader`.
- Bảo vệ route ở `layout.tsx` của admin bằng `getServerSession` (NextAuth) và kiểm tra role phía server.
  Ẩn menu theo role chỉ là tiện lợi, **quyền thật sự do backend kiểm soát**.
- `login` nằm bên trong `admin/` nên `layout.tsx` đang bao cả trang đăng nhập. Trang đăng nhập không được có sidebar/topbar
  và guard không được redirect vòng lặp tại `/admin/login`. Xem mục `layout.tsx` trong `references/admin-pages.md`
  để chọn cách xử lý; hỏi người dùng trước khi di chuyển file sang route group.

```tsx
// PageHeader: tiêu đề bên trái, hành động chính bên phải
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
  </div>
  {actions && <div className="flex items-center gap-2">{actions}</div>}
</div>
```

Mỗi trang chỉ có **một** nút primary (hành động chính, ví dụ "Thêm sản phẩm"); các hành động khác dùng variant `outline`/`ghost`.

### Bước 4. Trang danh sách (mẫu quan trọng nhất)

Thứ tự cố định: `PageHeader` → `FilterToolbar` → `DataTable` → `TablePagination`.

**Trạng thái bộ lọc nằm trên URL** (`?page=2&q=áo&status=PENDING`) để reload, chia sẻ link và nút Back đều đúng.
Component dùng `useSearchParams` phải được bọc trong `<Suspense>` ở page.

```ts
// src/hooks/useTableParams.ts
'use client';
import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useTableParams(defaults = { page: 1, pageSize: 20 }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = {
    page: Number(sp.get('page') ?? defaults.page),
    pageSize: Number(sp.get('pageSize') ?? defaults.pageSize),
    q: sp.get('q') ?? '',
    sort: sp.get('sort') ?? '',
    status: sp.get('status') ?? '',
  };

  const setParams = useCallback(
    (next: Record<string, string | number | undefined>) => {
      const usp = new URLSearchParams(sp.toString());
      Object.entries(next).forEach(([k, v]) =>
        v === undefined || v === '' ? usp.delete(k) : usp.set(k, String(v)),
      );
      if (!('page' in next)) usp.set('page', '1'); // đổi bộ lọc thì về trang 1
      router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  return { params, setParams };
}
```

Hook dữ liệu: đưa toàn bộ params vào `queryKey` và giữ dữ liệu cũ khi chuyển trang để bảng không nhấp nháy.

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderService.getAll(params).then((res) => res.data),
    placeholderData: keepPreviousData,
  });
}
```

Yêu cầu cho `DataTable`:

| Hạng mục | Quy tắc |
|---|---|
| Cấu trúc | `<table>` ngữ nghĩa, `<th scope="col">`, bọc `overflow-x-auto`, header `sticky top-0 bg-muted/50` |
| Mật độ | Hàng `h-11`, chữ `text-sm`, hover `hover:bg-muted/50`; không zebra + hover cùng lúc |
| Căn lề | Chữ căn trái; số, tiền, số lượng căn phải + `tabular-nums`; cột hành động căn phải, rộng cố định |
| Nội dung dài | `truncate max-w-*` kèm `title` để xem đầy đủ |
| Sắp xếp | Header bấm được là `<button>` có `aria-sort`, icon mũi tên từ lucide-react |
| Loading | 5–10 hàng `Skeleton` cùng số cột (không dùng spinner toàn trang); khi đổi trang giữ dữ liệu cũ, mờ nhẹ |
| Empty | `EmptyState` nói rõ tình huống: "Chưa có đơn hàng" + nút tạo, hoặc "Không có kết quả khớp bộ lọc" + nút "Xóa bộ lọc" |
| Error | `ErrorState` nêu lỗi gì và có nút "Thử lại" (`refetch`) |
| Phân trang | Server-side; hiển thị "Hiển thị 1–20 trong 245", chọn page size 10/20/50 |
| Tìm kiếm | Debounce 300ms trước khi ghi lên URL |
| Hành động hàng | Nút chính hiện sẵn (Xem/Sửa); hành động phụ gom lại; hành động phá hủy luôn qua `ConfirmDialog` |

Mỗi khối dữ liệu phải xử lý đủ **4 trạng thái: loading, empty, error, có dữ liệu**. Thiếu một trạng thái là chưa xong.

### Bước 5. Form quản lý (tạo/sửa)

- React Hook Form + Zod (`zodResolver`). Schema đặt cạnh form hoặc trong `src/lib/validations/`.
- Mỗi field luôn có `<Label>` hiển thị (placeholder không thay thế label). Field bắt buộc đánh dấu `*` và có `aria-required`.
- Lỗi hiện ngay dưới field, `text-sm text-destructive`, gắn `aria-invalid` và `aria-describedby` trỏ tới thông báo lỗi.
- Form dài chia thành section có tiêu đề (Thông tin cơ bản, Giá & tồn kho, Hình ảnh...), mỗi section một `Card`.
- Nhóm nút ở cuối (hoặc sticky footer với form dài): "Hủy" (outline) bên trái nút "Lưu thay đổi" (primary).
  Khi `isSubmitting`: vô hiệu hóa nút, hiện spinner nhỏ, giữ nguyên chữ nút.
- Lỗi từ server có thông tin theo field thì `setError(field, { message })`; lỗi chung thì hiện toast hoặc `Alert` đầu form.
- Form đang sửa dở (`isDirty`) mà người dùng bấm Hủy/đóng dialog thì hỏi xác nhận bỏ thay đổi.
- Chọn đúng control: ít lựa chọn thì `Tabs`/nhóm nút, nhiều thì `Select`; số tiền dùng `inputMode="numeric"`.

### Bước 6. Phản hồi & hành động phá hủy

- Thành công/thất bại của thao tác dùng `sonner`. **Động từ trong nút và toast phải trùng nhau**:
  nút "Xóa sản phẩm" → toast "Đã xóa sản phẩm". Lỗi phải nói rõ nguyên nhân và cách xử lý, không viết "Có lỗi xảy ra".
- Sau mutation phải `invalidateQueries` đúng key để bảng cập nhật.
- Cấm `window.confirm`/`alert`. Xóa và hủy đơn dùng `ConfirmDialog`, nêu tên đối tượng và hệ quả:
  "Xóa sản phẩm 'Áo sơ mi Oxford'? Hành động này không thể hoàn tác." Nút xác nhận là variant destructive
  và đặt tên theo hành động ("Xóa sản phẩm"), không dùng "OK".

```tsx
const qc = useQueryClient();
const remove = useMutation({
  mutationFn: (id: string) => productService.remove(id),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    toast.success('Đã xóa sản phẩm');
  },
  onError: () => toast.error('Không xóa được sản phẩm. Kiểm tra kết nối rồi thử lại.'),
});
```

### Bước 7. Dashboard

- Bố cục: hàng KPI (`StatCard`, 2–4 thẻ) → biểu đồ chính → bảng "gần đây". Mỗi thẻ KPI gồm nhãn, giá trị, và mức thay đổi
  so với kỳ trước kèm mũi tên **và** chữ (+8,2%), không chỉ màu.
- Chỉ dùng thẻ KPI cho số liệu người dùng thực sự cần theo dõi hằng ngày; đừng thêm cho đủ hàng.
- Recharts: dùng màu từ token (`hsl(var(--primary))`), có trục, tooltip, đơn vị (VND, đơn), và `ResponsiveContainer`.
  Nạp biểu đồ bằng `next/dynamic` với `ssr: false` để giảm bundle của trang.
- Bộ chọn khoảng thời gian (7 ngày / 30 ngày / Tháng này) đặt ở `PageHeader`, ảnh hưởng toàn bộ trang, lưu trên URL.
- Mỗi biểu đồ cũng cần đủ trạng thái loading (skeleton đúng kích thước), empty và error.

### Bước 8. Accessibility & chất lượng nền

- Mọi control dùng bằng bàn phím được; `focus-visible:ring-2 ring-ring ring-offset-2` hiển thị rõ, không bỏ `outline` mà không thay thế.
- Nút chỉ có icon phải có `aria-label` (ví dụ nút thu gọn sidebar, nút xóa hàng).
- Contrast chữ thường tối thiểu 4.5:1 ở cả light và dark; kiểm tra `text-muted-foreground` trên `bg-muted`.
- Không truyền đạt trạng thái chỉ bằng màu; kèm chữ hoặc icon.
- Tôn trọng `prefers-reduced-motion` (dùng `motion-reduce:` cho transition). Không animation trang trí; chỉ transition ngắn (150ms) cho hover/mở dialog.
- Radix Dialog đã xử lý focus trap và `Esc`; luôn có `DialogTitle` (dùng `sr-only` nếu không muốn hiện).
- Responsive: admin ưu tiên desktop nhưng không được vỡ ở 768px; bảng cuộn ngang trong wrapper, không làm cả trang cuộn ngang.

## Khoảng trống thư viện (cần hỏi trước khi thêm)

Dự án chưa có các gói sau. Hãy làm bằng thứ đang có; chỉ khi thật sự cần thì **dừng lại, nêu đề xuất và chờ người dùng đồng ý**.

| Nhu cầu | Cách làm với thư viện hiện có | Đề xuất nếu cần (phải hỏi) |
|---|---|---|
| Bảng có sort/select/ẩn cột phức tạp | `<table>` thuần + state sort trên URL | `@tanstack/react-table` |
| Menu hành động (…) trên hàng | Nhóm 1–2 nút icon ngay trên hàng | `@radix-ui/react-dropdown-menu` |
| Tooltip | Thuộc tính `title` + `aria-label` | `@radix-ui/react-tooltip` |
| Checkbox / Switch | `<input type="checkbox">` style bằng Tailwind | `@radix-ui/react-checkbox`, `react-switch` |
| Chọn ngày | `<input type="date">` | Popover + calendar |
| Test component | Test hàm thuần (`format.ts`, hook logic) bằng Vitest | `@testing-library/react` |

## Cách làm việc

1. Làm **từng feature/trang một**, giữ mỗi lần sửa nhỏ để dễ review. Không viết lại toàn bộ admin trong một lượt.
2. Tạo/hoàn thiện token và component dùng chung trước, rồi mới áp vào trang. Trang đầu tiên làm mẫu và xin xác nhận
   của người dùng trước khi nhân rộng.
3. Giữ nguyên props, service, query key và hành vi hiện có; nếu buộc phải đổi thì nói rõ.
   `page.tsx` chỉ ghép component và đọc params; phần bảng, form, dialog tách sang `src/components/<feature>/`
   (theo mẫu skill `create-fe-page`). Tách file là thay đổi cấu trúc, không được kèm đổi logic.
4. Không gộp thay đổi giao diện với thay đổi logic trong cùng một commit. Commit theo Conventional Commits, ví dụ
   `refactor(fe): standardize admin data table` hoặc `style(fe): add admin design tokens`.

## Kiểm tra trước khi báo hoàn thành

Chạy từ thư mục gốc và sửa hết lỗi:

```bash
npm run format
npm run lint:web
npm run typecheck:web
npm run test:web
```

Checklist rà soát trang vừa làm:

- [ ] Không còn màu hardcode (hex, `bg-blue-*`, `text-gray-*`) trong component admin
- [ ] Các lệnh quét trong `references/content-guidelines.md` (mục 6) không còn kết quả ở phần đã sửa
- [ ] Không còn lời chào marketing, emoji, tính từ tâng bốc, "Có lỗi xảy ra", "Không có dữ liệu" trơ trọi
- [ ] Không có số liệu, tên hay ảnh giả nằm cứng trong giao diện; mọi KPI đều từ API
- [ ] Một khái niệm một tên (khuyến mãi, tài khoản, đơn hàng...) ở menu, tiêu đề, nút và toast
- [ ] Không còn gradient, blur, bóng đổ lớn, thẻ lồng thẻ, animation vào trang
- [ ] Bố cục trang khớp mẫu trong `references/admin-pages.md`; `login` không hiển thị sidebar
- [ ] Đủ 4 trạng thái: loading, empty, error, có dữ liệu
- [ ] Bộ lọc, trang, sắp xếp nằm trên URL; reload giữ nguyên
- [ ] Số/tiền căn phải, dùng `formatCurrency`/`formatDate`; không tự format rải rác
- [ ] Mỗi trang có đúng một nút primary; hành động phá hủy đi qua `ConfirmDialog`
- [ ] Form có label, lỗi từng field, nút bị khóa khi đang gửi
- [ ] Duyệt được bằng bàn phím, focus nhìn thấy rõ, nút icon có `aria-label`
- [ ] Đẹp ở light và dark, không vỡ ở 768px
- [ ] Không thêm dependency mới khi chưa được đồng ý
- [ ] Không đụng backend hay API contract

## Báo cáo cuối

Tóm tắt ngắn cho người dùng: đã đổi gì (theo trang/component), những gì cố ý chưa làm, và các đề xuất
dependency đang chờ quyết định (nếu có).
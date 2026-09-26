---
name: database-migration
description: >-
  Quy trình thay đổi database schema qua Prisma.
  Sử dụng khi cần thêm/sửa/xóa bảng hoặc cột trong database.
---

# Database Migration

## Steps

### 1. Chỉnh sửa Prisma Schema
File: `fashion-shop-be/prisma/schema.prisma`

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Tạo migration
```bash
npm run prisma:migrate -- --name <migration-name>
```
Quy ước tên migration:
- `add-<table>-table` — Thêm bảng mới
- `add-<column>-to-<table>` — Thêm cột
- `remove-<column>-from-<table>` — Xóa cột
- `rename-<old>-to-<new>` — Đổi tên

### 3. Regenerate Prisma Client
```bash
npm run prisma:generate
```

### 4. Cập nhật seed data (nếu cần)
File: `fashion-shop-be/prisma/seed-deploy.ts`

### 5. Verify
- Kiểm tra migration file được tạo tại `prisma/migrations/`
- Kiểm tra Prisma Client types đã cập nhật
- Test service/controller liên quan

## Rollback
- Prisma KHÔNG hỗ trợ rollback tự động
- Nếu cần revert: tạo migration mới để undo thay đổi
- Trong dev: có thể dùng `npx prisma migrate reset` (XÓA TOÀN BỘ DATA)

## Lưu ý quan trọng
- KHÔNG sửa database trực tiếp — luôn dùng Prisma migration
- KHÔNG xóa file migration đã commit
- Kiểm tra kỹ `schema.prisma` trước khi chạy migration
- Backup data production trước khi deploy migration mới

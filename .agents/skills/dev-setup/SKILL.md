---
name: dev-setup
description: >-
  Hướng dẫn cài đặt môi trường phát triển cho dự án Fashion Shop.
  Sử dụng khi thành viên mới tham gia hoặc khi cần setup lại từ đầu.
---

# Dev Setup

## Prerequisites
- Node.js >= 18
- Docker Desktop (cho PostgreSQL)
- Git

## Steps

1. Clone repo và cài dependencies:
   ```bash
   git clone <repo-url>
   cd fashion-shop
   npm install
   ```

2. Khởi động PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

3. Cấu hình environment:
   ```bash
   cp fashion-shop-be/.env.example fashion-shop-be/.env
   cp fashion-shop-fe/.env.example fashion-shop-fe/.env
   ```
   Chỉnh sửa `.env` nếu cần thay đổi port hoặc DB credentials.

4. Chạy Prisma migration & seed:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Khởi động dev servers:
   ```bash
   # Terminal 1 — Backend (port 3000)
   npm run dev:api

   # Terminal 2 — Frontend (port 5000)
   npm run dev:web
   ```

## Hoặc dùng setup script (all-in-one):
```bash
npm run setup
```

## Verification
- Backend API: http://localhost:3000/api
- Frontend: http://localhost:5000
- Swagger docs: http://localhost:3000/api/docs

## Troubleshooting
- Nếu port 5432 bị chiếm: Kiểm tra `docker ps` hoặc dừng PostgreSQL local
- Nếu migration lỗi: Chạy `npx prisma migrate reset --force` (CHÚ Ý: xóa toàn bộ data)
- Nếu `npm install` lỗi: Xóa `node_modules` và `package-lock.json`, chạy lại

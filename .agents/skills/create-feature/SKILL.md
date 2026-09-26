---
name: create-feature
description: >-
  Quy trình tạo feature mới end-to-end (Backend API + Frontend UI).
  Sử dụng khi cần implement một tính năng mới hoàn chỉnh từ database đến UI.
---

# Create Feature (Full-Stack)

## Quy trình

### 1. Tạo branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<scope>-<tên-feature>
```

### 2. Backend — Tạo module mới
```
fashion-shop-be/src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

### 3. Database — Cập nhật Prisma schema (nếu cần)
1. Sửa `fashion-shop-be/prisma/schema.prisma`
2. Chạy `npm run prisma:migrate -- --name add-<feature>-table`
3. Chạy `npm run prisma:generate`

### 4. Frontend — Tạo page + components
```
fashion-shop-fe/src/
├── app/<route>/page.tsx
├── components/<feature>/
│   ├── <Feature>List.tsx
│   └── <Feature>Card.tsx
├── services/<feature>.service.ts
└── types/<feature>.ts
```

### 5. Test & Verify
- Test API qua Swagger / curl
- Test UI trên browser
- Chạy `npm run lint` và `npm run typecheck:web`

### 6. Commit & PR
```bash
git add -A
git commit -m "feat(<scope>): add <feature> module"
git push origin feature/<scope>-<tên-feature>
```
Tạo PR vào `develop` trên GitHub.

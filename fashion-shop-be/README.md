# Book Shop Backend

NestJS + TypeScript + Prisma + PostgreSQL backend.

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

API: http://localhost:3000/api
Swagger: http://localhost:3000/docs
Health: http://localhost:3000/api/health

## Main endpoints

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PATCH /api/account/me`
- Books and authors CRUD
- Authenticated order creation/list/cancel
- `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`
- `POST/GET /api/promotions` for admins
- `GET /api/statistics/overview` for admins

# Architecture Rules

## Monorepo Structure
```
fashion-shop/
├── fashion-shop-be/     # NestJS Backend API
├── fashion-shop-fe/     # Next.js Frontend
├── docker-compose.yml   # PostgreSQL + services
├── .agents/             # AI agent customizations
└── .planning/           # Project planning artifacts
```

## Backend Architecture (NestJS)
- **Pattern**: Modular, layered (Controller → Service → Prisma)
- **Modules**: Mỗi domain entity là 1 module riêng trong `src/modules/`
- **Data Access**: Prisma ORM — KHÔNG dùng raw SQL trừ khi cần tối ưu performance
- **Auth**: JWT + Passport — stateless authentication
- **Validation**: class-validator + class-transformer qua DTOs
- **API prefix**: `/api` — tất cả endpoints bắt đầu bằng `/api/`

## Frontend Architecture (Next.js)
- **Routing**: App Router (`src/app/`)
- **Components**: `src/components/` — chia theo feature
- **Services**: `src/services/` — API client functions (Axios)
- **State**: `src/stores/` — Zustand stores
- **Types**: `src/types/` — shared TypeScript interfaces
- **Hooks**: `src/hooks/` — custom React hooks

## Quy tắc quan trọng
- Frontend và Backend giao tiếp HOÀN TOÀN qua REST API
- KHÔNG share code trực tiếp giữa FE và BE (mỗi workspace độc lập)
- Database schema quản lý qua Prisma migrations — KHÔNG sửa DB trực tiếp
- Environment variables qua `.env` files — KHÔNG hardcode

# Fashion Shop v2 — Agent Rules

## Project Overview
Fashion Shop là một nền tảng e-commerce chuyên về thời trang / quần áo, được xây dựng dưới dạng monorepo full-stack.

## Tech Stack
- **Backend**: NestJS v11, TypeScript, Prisma v6, PostgreSQL
- **Frontend**: Next.js v15 (App Router), React 19, Tailwind CSS, shadcn/ui (Radix UI)
- **Auth**: JWT + Passport (BE), NextAuth.js (FE)
- **State**: Zustand (client-side), React Query / TanStack Query (server-side)
- **Forms**: React Hook Form + Zod validation

## Project Structure
```
fashion-shop/
├── fashion-shop-be/       # NestJS Backend API (port 3000)
│   ├── prisma/            # Schema, migrations, seed
│   └── src/modules/       # Feature modules (accounts, auth, books, orders, promotions...)
├── fashion-shop-fe/       # Next.js Frontend (port 5000)
│   └── src/
│       ├── app/           # App Router pages
│       ├── components/    # UI components (theo feature)
│       ├── services/      # API client (Axios)
│       ├── stores/        # Zustand stores
│       ├── hooks/         # Custom React hooks
│       └── types/         # TypeScript interfaces
├── docker-compose.yml     # PostgreSQL
├── .agents/               # AI agent rules & skills
└── .github/               # CI workflow, PR template
```

## How to Run

### Prerequisites
- Node.js >= 18, Docker Desktop, Git

### Quick Start
```bash
npm install
docker-compose up -d postgres
cp fashion-shop-be/.env.example fashion-shop-be/.env
cp fashion-shop-fe/.env.example fashion-shop-fe/.env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Dev Servers
```bash
npm run dev:api    # Backend  → http://localhost:3000/api
npm run dev:web    # Frontend → http://localhost:5000
```

### All Available Scripts
| Script | Mô tả |
|---|---|
| `npm run dev:api` | Chạy backend dev server |
| `npm run dev:web` | Chạy frontend dev server |
| `npm run build:api` | Build backend |
| `npm run build:web` | Build frontend |
| `npm run lint` | Lint cả BE + FE |
| `npm run lint:api` | Lint backend |
| `npm run lint:web` | Lint frontend |
| `npm run test:web` | Chạy frontend tests (Vitest) |
| `npm run typecheck:web` | TypeScript check frontend |
| `npm run format` | Format code (Prettier) |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Chạy database migrations |
| `npm run prisma:seed` | Seed database |
| `npm run setup` | All-in-one: install + db + prisma |

## Environment Variables

### Backend (`fashion-shop-be/.env`)
| Variable | Default |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fashionshop?schema=public` |
| `JWT_SECRET` | `change-me` |
| `PORT` | `3000` |

### Frontend (`fashion-shop-fe/.env`)
| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` |

---

## Mandatory Rules

### Code Style
- TypeScript strict mode cho cả BE và FE
- Sử dụng Prettier để format. Không commit code chưa format
- Backend: tuân theo NestJS conventions (Controller → Service → Prisma)
- Frontend: component-based với shadcn/ui (Radix UI) + Tailwind CSS

### Naming
- Backend files: `feature.controller.ts`, `feature.service.ts`, `feature.module.ts`, `feature.dto.ts`
- Frontend components: PascalCase (`OrderDetailModal.tsx`)
- Next.js pages: lowercase (`page.tsx`, `layout.tsx`)
- API routes: RESTful, plural nouns (`/api/products`, `/api/orders`)

### Git
- Commit messages: Conventional Commits format — `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
- Branch naming: `feature/`, `bugfix/`, `hotfix/`, `release/`
- Scope: `be`, `fe`, `prisma`, `docker`, `ci`, `docs`
- KHÔNG commit trực tiếp vào `main` hoặc `develop`

### Security
- KHÔNG bao giờ hardcode secrets, API keys, hoặc passwords
- Sử dụng `.env` files (đã được gitignore)
- Tham khảo `.env.example` cho danh sách biến môi trường cần thiết

### Dependencies
- Backend validation: class-validator + class-transformer (DTOs)
- Frontend state: Zustand (client) + React Query (server)
- Frontend forms: React Hook Form + Zod
- KHÔNG thêm dependency mới mà chưa discuss với team

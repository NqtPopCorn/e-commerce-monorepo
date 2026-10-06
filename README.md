# Fashion Shop

> Full-stack e-commerce platform cho thời trang & quần áo — NestJS + Next.js monorepo

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS v11, TypeScript, Prisma v7, PostgreSQL |
| **Frontend** | Next.js v15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| **Auth** | JWT + Passport (BE), NextAuth.js (FE) |
| **State** | Zustand (client), React Query (server) |
| **Forms** | React Hook Form + Zod |

## Project Structure

```
fashion-shop/
├── fashion-shop-be/     # NestJS Backend API (port 3000)
├── fashion-shop-fe/     # Next.js Frontend (port 5000)
├── docker-compose.yml   # PostgreSQL
├── .agents/             # AI agent skills & rules
├── .planning/           # Project planning docs
└── package.json         # npm workspaces root
```

## Quick Start

### Prerequisites
- **Node.js** >= 18
- **Docker Desktop** (cho PostgreSQL)
- **Git**

### Setup

```bash
# Clone & install
git clone <repo-url>
cd fashion-shop
npm install

# Start PostgreSQL
docker-compose up -d postgres

# Configure environment
cp fashion-shop-be/.env.example fashion-shop-be/.env
cp fashion-shop-fe/.env.example fashion-shop-fe/.env

# Database setup
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Hoặc chạy all-in-one (sau khi đã copy `.env` files):
```bash
npm run setup
```

### Development

```bash
# Backend (port 3000)
npm run dev:api

# Frontend (port 5000)
npm run dev:web
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev:api` | Start backend dev server |
| `npm run dev:web` | Start frontend dev server |
| `npm run build:api` | Build backend |
| `npm run build:web` | Build frontend |
| `npm run lint` | Lint both projects |
| `npm run test:web` | Run frontend tests |
| `npm run typecheck:web` | TypeScript check frontend |
| `npm run format` | Format code (Prettier) |
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop PostgreSQL container |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database |

## Environment Variables

### Backend (`fashion-shop-be/.env`)
| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/fashionshop?schema=public` |
| `JWT_SECRET` | JWT signing secret | `change-me` |
| `PORT` | API server port | `3000` |

### Frontend (`fashion-shop-fe/.env`)
| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |

## Git Workflow

Xem chi tiết tại [CONTRIBUTING.md](./CONTRIBUTING.md).

- **Branches**: `main` (production) → `develop` (integration) → `feature/*` (development)
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) format
- **PRs**: Tạo PR vào `develop`, yêu cầu review

## License

Private — All rights reserved.

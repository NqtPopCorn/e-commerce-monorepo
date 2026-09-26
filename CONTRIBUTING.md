# Contributing to Fashion Shop

## Getting Started

1. Clone repo và setup theo hướng dẫn trong [README.md](./README.md)
2. Tạo branch mới từ `develop`
3. Code, test, commit, push, tạo PR

## Git Workflow

### Branching

| Nhánh | Mục đích | Tách từ | Merge vào |
|---|---|---|---|
| `main` | Production | — | — |
| `develop` | Integration | `main` | `main` |
| `feature/<tên>` | Tính năng mới | `develop` | `develop` |
| `bugfix/<tên>` | Sửa bug | `develop` | `develop` |
| `hotfix/<tên>` | Bug khẩn cấp | `main` | `main` + `develop` |
| `release/<ver>` | Chuẩn bị release | `develop` | `main` + `develop` |

### Branch Naming

```
feature/BE-add-payment-gateway
feature/FE-redesign-product-page
bugfix/BE-fix-order-total
hotfix/FE-fix-login-crash
release/v1.1.0
```

### Commit Messages

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` — Thêm feature mới
- `fix` — Sửa bug
- `docs` — Thay đổi documentation
- `style` — Format code (không thay đổi logic)
- `refactor` — Refactor code
- `test` — Thêm/sửa test
- `chore` — Maintenance (deps, CI, config)
- `perf` — Cải thiện performance

**Scopes:** `be`, `fe`, `prisma`, `docker`, `ci`, `docs`

**Ví dụ:**
```
feat(be): add product search endpoint with filters
fix(fe): resolve cart total calculation on discount
chore(ci): add lint check to GitHub Actions
docs: update README with new setup instructions
```

## Pull Request Process

1. **Tạo PR** vào `develop` (hoặc `main` cho hotfix)
2. **Điền PR template** — mô tả thay đổi, link issue
3. **Đảm bảo CI pass** — lint, typecheck, tests
4. **Request review** từ ít nhất 1 team member
5. **Address feedback** — sửa theo review comments
6. **Merge** — Squash merge vào `develop`

## Code Standards

- TypeScript strict mode
- Format code với Prettier trước khi commit
- Không dùng `any` — dùng proper types
- Backend: Controller → Service → Prisma pattern
- Frontend: shadcn/ui components, React Query, Zustand

## Questions?

Liên hệ team lead hoặc tạo Discussion trên GitHub.

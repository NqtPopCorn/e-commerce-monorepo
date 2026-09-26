# Git Workflow

## Branching Model (Git Flow Simplified)
- `main` — Production-ready code. Protected branch, chỉ merge qua PR
- `develop` — Integration branch. Protected branch, chỉ merge qua PR
- `feature/<tên>` — Phát triển tính năng mới, tách từ `develop`
- `bugfix/<tên>` — Sửa bug, tách từ `develop`
- `hotfix/<tên>` — Sửa bug khẩn cấp, tách từ `main`, merge vào cả `main` + `develop`
- `release/<version>` — Chuẩn bị release, merge vào `main` + `develop`

## Quy ước đặt tên nhánh
- Prefix scope: `BE-`, `FE-` cho backend/frontend specific
- Ví dụ: `feature/BE-add-payment-gateway`, `bugfix/FE-fix-cart-total`

## Commit Convention (Conventional Commits)
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`
- Scopes: `be`, `fe`, `prisma`, `docker`, `ci`, `docs`
- Ví dụ: `feat(be): add order status webhook endpoint`

## Pull Request
- PR description phải mô tả rõ thay đổi
- Link issue/task liên quan
- Request review từ ít nhất 1 team member
- Đảm bảo CI checks pass trước khi merge

## Quy tắc
- KHÔNG commit trực tiếp vào `main` hoặc `develop`
- KHÔNG force push vào protected branches
- Squash merge khi merge feature vào develop
- Rebase trước khi tạo PR nếu develop đã có commits mới

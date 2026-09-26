# Coding Standards

## TypeScript
- Sử dụng strict mode (`strict: true` trong `tsconfig.json`)
- Luôn khai báo kiểu dữ liệu rõ ràng cho function parameters và return types
- Tránh sử dụng `any` — dùng `unknown` và type narrowing thay thế
- Sử dụng `interface` cho object shapes, `type` cho unions/intersections

## Backend (NestJS)
- Mỗi module gồm: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- Controller chỉ xử lý HTTP request/response — KHÔNG chứa business logic
- Service chứa toàn bộ business logic
- Validation qua DTOs với `class-validator` decorators
- Inject dependencies qua constructor

## Frontend (Next.js)
- Components dùng functional components + hooks
- UI library: shadcn/ui (Radix UI primitives + Tailwind CSS)
- Styling: Tailwind CSS, dùng `cn()` helper (clsx + tailwind-merge)
- Data fetching: React Query (`@tanstack/react-query`)
- Client state: Zustand stores
- Forms: React Hook Form + Zod validation

## Formatting
- Prettier cho auto-format
- Single quotes, semicolons, 2-space indent
- Max line width: 100 characters

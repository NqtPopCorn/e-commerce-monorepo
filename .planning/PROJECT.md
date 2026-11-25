# Fashion Shop

## What This Is

A full-stack web application for managing a fashion & clothing e-commerce store. It provides a robust backend API built with NestJS and a dynamic frontend built with Next.js, supporting e-commerce flows, user management, and administrative dashboards.

## Core Value

To provide a seamless, performant, and scalable platform for browsing, purchasing, and managing fashion products and related entities (brands, categories, sizes, promotions).

## Requirements

### Validated

- ✓ **User Account Management** — existing functionality for user registration, profiles, and roles (`accounts` module).
- ✓ **Authentication** — existing JWT-based stateless authentication and authorization (`auth` module).
- ✓ **Product Catalog** — existing domain logic for managing products, including details, pricing, and inventory (`books` module — pending rename to `products`).
- ✓ **Categories** — existing entities for organizing the product catalog (`categories` module).
- ✓ **Order Processing** — existing logic for handling customer purchases and order lifecycles (`orders` module).
- ✓ **Promotions and Discounts** — existing capabilities for applying promotional logic to products or orders (`promotions` module).
- ✓ **Analytics and Dashboards** — existing statistics module for generating insights and administrative views (`statistics` module).
- ✓ **Batch Processing** — existing background or scheduled batch operations (`batches` module).

### Active (Phạm vi hiện tại)

- [ ] Hoàn thiện các module cốt lõi của Fashion Shop (sản phẩm, tài khoản, đơn hàng, thanh toán cơ bản).
- [ ] Thiết lập quy trình kiểm thử tự động (unit test & e2e).

### Định Hướng Tương Lai Xa (Long-Term Future Vision — Không thuộc phạm vi hiện tại)
> **Lưu ý:** Các hạng mục dưới đây là backlog định hướng cho **tương lai xa**, khi hệ thống đã ổn định và mở rộng quy mô. Chi tiết xem tại **[Lộ trình Tương lai xa (docs/ROADMAP.md)](../docs/ROADMAP.md)**:

- [ ] **Tương lai xa (Đợt 1)**:
  - Flow hoàn tiền khi hủy đơn hàng / lỗi giao dịch & Quy trình Đổi / Trả hàng.
  - Tích hợp cổng thanh toán chính thức & Xuất hóa đơn điện tử PDF.
  - Đồng bộ giỏ hàng trên Server (Server-side synced cart & merge cart).
- [ ] **Tương lai xa (Đợt 2)**:
  - Đánh giá sản phẩm (Ratings 1-5 sao, bình luận, ảnh thực tế, like/helpful count, staff reply).
  - Xuất báo cáo (Excel, CSV, PDF) & Module phân tích kinh doanh chuyên sâu.
  - Siết chặt bảo mật (Rate Limiting, brute-force defense, audit logs, RBAC).
- [ ] **Tương lai xa (Đợt 3)**:
  - Blog quảng bá thời trang (CMS biên tập, SEO on-page, shoppable articles).
  - Quản lý Bộ sưu tập & Lookbook thời trang theo mùa.
  - AI Agent hỗ trợ Admin lên ý tưởng & tự động tạo Marketing Campaign.
- [ ] **Tương lai xa (Đợt 4)**:
  - Livechat CSKH trực tiếp giữa nhân viên (human) và khách hàng.

### Out of Scope

- Major architectural rewrites of the existing Next.js / NestJS stack.

## Context

**Current State**
- The project is a monorepo with `fashion-shop-fe` and `fashion-shop-be`.
- Transitioning domain from bookstore to fashion/clothing e-commerce.
- Architecture is decoupled (REST API backend, React frontend).

**Key Constraints**
- Backend must remain in NestJS/TypeScript with Prisma ORM and PostgreSQL.
- Frontend must utilize Next.js App Router, Tailwind CSS, and Zustand/React Query.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rename to Fashion Shop | Pivot from bookstore to fashion e-commerce | ✅ Done — folders, configs, docs renamed |
| Git Flow branching | Team collaboration with protected branches | ✅ Done — CONTRIBUTING.md, branch strategy |
| AGENTS customization | Consistent AI agent behavior across team | ✅ Done — rules + 5 skills |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-09-26 after Fashion Shop rename & team setup*

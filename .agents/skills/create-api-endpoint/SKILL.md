---
name: create-api-endpoint
description: >-
  Quy trình chuẩn để tạo API endpoint mới trong NestJS backend.
  Sử dụng khi cần thêm controller, service, DTO cho một resource mới.
---

# Create API Endpoint

## Steps

### 1. Xác định endpoint
- Method: GET / POST / PUT / PATCH / DELETE
- Path: `/api/<resources>` (plural nouns)
- Auth: Có yêu cầu JWT không?

### 2. Tạo DTO (Data Transfer Object)
```typescript
// fashion-shop-be/src/modules/<feature>/dto/create-<feature>.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}
```

### 3. Tạo Service
```typescript
// fashion-shop-be/src/modules/<feature>/<feature>.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeatureService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.<model>.findMany();
  }

  async create(dto: CreateFeatureDto) {
    return this.prisma.<model>.create({ data: dto });
  }
}
```

### 4. Tạo Controller
```typescript
// fashion-shop-be/src/modules/<feature>/<feature>.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/<features>')
export class FeatureController {
  constructor(private service: FeatureService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFeatureDto) {
    return this.service.create(dto);
  }
}
```

### 5. Tạo Module & Register
```typescript
// fashion-shop-be/src/modules/<feature>/<feature>.module.ts
import { Module } from '@nestjs/common';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
})
export class FeatureModule {}
```

Thêm `FeatureModule` vào `imports` trong `app.module.ts`.

### 6. Test
- Swagger: http://localhost:3000/api/docs
- curl: `curl http://localhost:3000/api/<features>`

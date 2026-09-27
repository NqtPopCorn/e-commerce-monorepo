import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query("search") search?: string,
    @Query("categoryId") categoryId?: string,
    @Query("brandId") brandId?: string,
  ) {
    return this.service.findAll({
      search,
      categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      brandId: brandId ? parseInt(brandId, 10) : undefined,
    });
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

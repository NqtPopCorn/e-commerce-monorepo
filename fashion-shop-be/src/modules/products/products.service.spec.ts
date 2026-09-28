import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProductsService } from './products.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should create a product and generate slug if not provided', async () => {
      prismaMock.product.create.mockResolvedValue({ id: 1, name: 'Áo Thun', slug: 'ao-thun-123' } as any);
      const res = await service.create({ name: 'Áo Thun', categoryId: 1, brandId: 1 } as any);
      expect(res.name).toBe('Áo Thun');
      expect(res.slug).toBe('ao-thun-123');
      expect(prismaMock.product.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      prismaMock.product.count.mockResolvedValue(1);
      prismaMock.product.findMany.mockResolvedValue([{ id: 1, name: 'A' }] as any);
      
      const res = await service.findAll({ page: 1, limit: 10 }) as any;
      expect(res.data.length).toBe(1);
      expect(res.meta.total).toBe(1);
    });

    it('should return all products if no pagination', async () => {
      prismaMock.product.findMany.mockResolvedValue([{ id: 1, name: 'A' }] as any);
      
      const res = await service.findAll() as any;
      expect(res.length).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should calculate stats correctly', async () => {
      prismaMock.product.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
      prismaMock.productVariant.findMany.mockResolvedValue([
        { stock: 10, sellingPrice: 100, productId: 1 } as any,
        { stock: 0, sellingPrice: 200, productId: 2 } as any,
      ]);

      const stats = await service.getStats();
      expect(stats.totalProducts).toBe(10);
      expect(stats.newThisWeek).toBe(2);
      expect(stats.totalStockValue).toBe(1000);
      expect(stats.outOfStock).toBe(1);
    });
  });

  describe('findOne / findBySlug', () => {
    it('should find product by id', async () => {
      prismaMock.product.findUnique.mockResolvedValue({ id: 1 } as any);
      const res = await service.findOne(1);
      expect(res.id).toBe(1);
    });

    it('should throw NotFoundException if id missing', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should find product by slug', async () => {
      prismaMock.product.findUnique.mockResolvedValue({ id: 1, slug: 'test' } as any);
      const res = await service.findBySlug('test');
      expect(res.slug).toBe('test');
    });
  });
});

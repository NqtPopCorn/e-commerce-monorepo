import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BatchesService } from './batches.service';

describe('BatchesService', () => {
  let service: BatchesService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  describe('create', () => {
    it('should create a batch and increment stock', async () => {
      const dto = { code: 'BATCH1', variantId: 1, quantity: 50 };
      prismaMock.batch.create.mockResolvedValue({ id: 1 } as any);

      await service.create(dto);

      expect(prismaMock.batch.create).toHaveBeenCalled();
      expect(prismaMock.productVariant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { increment: 50 } }
      });
    });
  });

  describe('findAll', () => {
    it('should return batches', async () => {
      prismaMock.batch.findMany.mockResolvedValue([{ id: 1 }] as any);

      const res = await service.findAll();
      expect(res.length).toBe(1);
    });
  });
});

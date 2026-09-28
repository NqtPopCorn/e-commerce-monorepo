import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  describe('overview', () => {
    it('should aggregate stats', async () => {
      prismaMock.order.aggregate.mockResolvedValue({ _sum: { total: 1000000 } } as any);
      prismaMock.order.count.mockResolvedValue(50);
      (prismaMock as any).orderItem.aggregate.mockResolvedValue({ _sum: { quantity: 200 } } as any);

      const res = await service.overview();
      expect(res.revenue).toBe(1000000);
      expect(res.orders).toBe(50);
      expect(res.productsSold).toBe(200);
    });
  });
});

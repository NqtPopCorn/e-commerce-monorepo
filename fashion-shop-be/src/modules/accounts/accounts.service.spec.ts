import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { AccountsService } from "./accounts.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

describe("AccountsService", () => {
  let service: AccountsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: AuditLogsService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  describe("findAll", () => {
    it("should return paginated accounts with correct role", async () => {
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, email: "admin@test.com", role: "ADMIN" },
      ] as any);

      const res = await service.findAll({ role: "ADMIN", page: 1, limit: 10 });
      expect(res.data.length).toBe(1);
      expect(res.data[0].role).toBe("ADMIN");
      expect(res.meta.total).toBe(1);
    });

    it("should search by email", async () => {
      prismaMock.user.count.mockResolvedValue(1);
      prismaMock.user.findMany.mockResolvedValue([
        { id: 1, email: "search@test.com", role: "CUSTOMER" },
      ] as any);

      const res = await service.findAll({ search: "search" });
      expect(res.data[0].email).toBe("search@test.com");
    });
  });

  describe("getSummary", () => {
    it("should return counts summary", async () => {
      prismaMock.user.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(9) // active
        .mockResolvedValueOnce(1) // blocked
        .mockResolvedValueOnce(2) // admins
        .mockResolvedValueOnce(3) // staffs
        .mockResolvedValueOnce(5); // customers

      const res = await service.getSummary();
      expect(res.total).toBe(10);
      expect(res.active).toBe(9);
      expect(res.staffs).toBe(3);
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 2,
        email: "user@test.com",
        status: "BLOCKED",
      } as any);
      prismaMock.user.update.mockResolvedValue({
        id: 2,
        email: "user@test.com",
        status: "ACTIVE",
      } as any);
      const res = await service.updateStatus(2, "ACTIVE");
      expect(res.status).toBe("ACTIVE");
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { status: "ACTIVE" },
        select: { id: true, email: true, status: true },
      });
    });
  });
});

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { VietQRService } from "./providers/vietqr.service";

@Module({
  imports: [PrismaModule, AuditLogsModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, VietQRService],
  exports: [PaymentsService, VietQRService],
})
export class PaymentsModule {}

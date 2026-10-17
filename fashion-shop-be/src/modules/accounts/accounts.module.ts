import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { PreferencesController } from "./preferences.controller";
import { AccountsService } from "./accounts.service";

@Module({
  controllers: [AccountsController, PreferencesController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

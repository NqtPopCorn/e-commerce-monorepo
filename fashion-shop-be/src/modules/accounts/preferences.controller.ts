import { Body, Controller, Get, Param, Patch, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccountsService } from "./accounts.service";
import { UpdateUserPreferenceDto } from "./dto/user-preference.dto";

@ApiTags("preferences")
@Controller("preferences")
export class PreferencesController {
  constructor(private readonly service: AccountsService) {}

  @Get(":userId")
  getPreferences(@Param("userId") userId: string) {
    return this.service.getPreferences(+userId);
  }

  @Put(":userId")
  updatePreferences(
    @Param("userId") userId: string,
    @Body() dto: UpdateUserPreferenceDto,
  ) {
    return this.service.updatePreferences(+userId, dto);
  }

  @Patch(":userId")
  patchPreferences(
    @Param("userId") userId: string,
    @Body() dto: UpdateUserPreferenceDto,
  ) {
    return this.service.updatePreferences(+userId, dto);
  }
}

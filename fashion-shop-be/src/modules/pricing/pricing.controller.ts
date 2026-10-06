import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PricingService } from "./pricing.service";
import { QuoteDto } from "./dto/quote.dto";

@ApiTags("pricing")
@Controller(["pricing", "promotions"])
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("quote")
  quote(@Body() dto: QuoteDto) {
    return this.pricingService.quote(dto.items, dto.voucherCode);
  }
}

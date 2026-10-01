import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PAYMENT_CONSTANTS } from "../constants/payment.constants";
import { buildVietQrPayload } from "../utils/vietqr-emv";

export interface VietQRInfoResponse {
  orderId: number;
  qrUrl: string;
  emvPayload: string;
  bankBin: string;
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  transferContent: string;
}

@Injectable()
export class VietQRService {
  constructor(private readonly config: ConfigService) {}

  getBankBin(): string {
    return (
      this.config.get<string>("VIETQR_BANK_BIN") ||
      PAYMENT_CONSTANTS.DEFAULT_BANK_BIN
    );
  }

  getBankId(): string {
    return (
      this.config.get<string>("VIETQR_BANK_ID") ||
      PAYMENT_CONSTANTS.DEFAULT_BANK_ID
    );
  }

  getBankName(): string {
    return (
      this.config.get<string>("VIETQR_BANK_NAME") ||
      PAYMENT_CONSTANTS.DEFAULT_BANK_NAME
    );
  }

  getAccountNo(): string {
    return this.config.get<string>("VIETQR_ACCOUNT_NO") || "0987654321";
  }

  getAccountName(): string {
    return (
      this.config.get<string>("VIETQR_ACCOUNT_NAME") || "FASHION SHOP OFFICIAL"
    );
  }

  getTemplate(): string {
    return (
      this.config.get<string>("VIETQR_TEMPLATE") ||
      PAYMENT_CONSTANTS.DEFAULT_TEMPLATE
    );
  }

  generateVietQR(order: { id: number; total: any }): VietQRInfoResponse {
    const bankBin = this.getBankBin();
    const bankId = this.getBankId();
    const bankName = this.getBankName();
    const accountNo = this.getAccountNo();
    const accountName = this.getAccountName();
    const template = this.getTemplate();
    const amount = Math.round(Number(order.total));
    const transferContent = `${PAYMENT_CONSTANTS.CODE_PREFIX}${order.id}`;

    // 1. Sinh chuỗi TLV chuẩn NAPAS EMVCo cục bộ với CRC-16
    let emvPayload = "";
    try {
      emvPayload = buildVietQrPayload({
        bin: bankBin,
        accountNo: accountNo,
        amount: amount,
        addInfo: transferContent,
      });
    } catch (err) {
      console.warn("Could not generate local EMVCo string:", err);
    }

    // 2. Sinh đường dẫn ảnh QuickLink tiện lợi (img.vietqr.io)
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent,
    )}&accountName=${encodeURIComponent(accountName)}`;

    return {
      orderId: order.id,
      qrUrl,
      emvPayload,
      bankBin,
      bankId,
      bankName,
      accountNo,
      accountName,
      amount,
      transferContent,
    };
  }
}

import {
  crc16,
  buildVietQrPayload,
  isValidVietQrPayload,
  sanitizeTransferContent,
} from "./vietqr-emv";
import { extractOrderIdFromMemo, squashMemo } from "./transfer-code";

describe("VietQR EMVCo & Transfer Code Utilities", () => {
  describe("crc16", () => {
    it("should compute standard CRC-16/CCITT-FALSE check value (123456789 -> 29B1)", () => {
      // Standard ISO test vector for CRC-16/CCITT-FALSE
      expect(crc16("123456789")).toBe("29B1");
    });
  });

  describe("sanitizeTransferContent", () => {
    it("should strip Vietnamese diacritics and special characters", () => {
      const sanitized = sanitizeTransferContent(
        "Đơn hàng #102 - Cảm ơn quý khách!",
      );
      expect(sanitized).toBe("Don hang 102  Cam on quy");
    });

    it("should cap at maximum 25 characters", () => {
      const longText = "DAY LA MOT NOI DUNG RAT DAI QUA 25 KY TU";
      expect(sanitizeTransferContent(longText, 25).length).toBeLessThanOrEqual(
        25,
      );
    });
  });

  describe("buildVietQrPayload and isValidVietQrPayload", () => {
    it("should build a valid VietQR payload and pass CRC validation", () => {
      const payload = buildVietQrPayload({
        bin: "970422", // MB Bank
        accountNo: "0987654321",
        amount: 250000,
        addInfo: "DH102",
      });

      expect(payload).toContain("000201");
      expect(payload).toContain("970422");
      expect(payload).toContain("0987654321");
      expect(payload).toContain("250000");
      expect(payload).toContain("DH102");
      expect(isValidVietQrPayload(payload)).toBe(true);
    });

    it("should build valid static QR when amount is omitted or 0", () => {
      const payload = buildVietQrPayload({
        bin: "970436", // Vietcombank
        accountNo: "1234567890",
        addInfo: "DH103",
      });

      expect(payload).toContain("010211"); // 11 = static
      expect(isValidVietQrPayload(payload)).toBe(true);
    });

    it("should reject invalid BIN", () => {
      expect(() =>
        buildVietQrPayload({
          bin: "123", // not 6 digits
          accountNo: "1234567890",
        }),
      ).toThrow("VietQR bin must be 6 digits");
    });
  });

  describe("extractOrderIdFromMemo", () => {
    it("should extract Order ID from standard format DH102", () => {
      expect(extractOrderIdFromMemo("DH102")).toBe(102);
      expect(extractOrderIdFromMemo("dh102")).toBe(102);
      expect(extractOrderIdFromMemo("DH 102")).toBe(102);
    });

    it("should extract Order ID from noisy bank statement memo", () => {
      const bankMemo = "MBVCB.12345678.DH4599.CHUYEN TIEN MUA HANG";
      expect(extractOrderIdFromMemo(bankMemo)).toBe(4599);
    });

    it("should return null when no order ID is found", () => {
      expect(extractOrderIdFromMemo("CHUYEN TIEN AN TOI")).toBeNull();
      expect(extractOrderIdFromMemo("")).toBeNull();
    });
  });

  describe("squashMemo", () => {
    it("should uppercase and remove spaces/special characters", () => {
      expect(squashMemo("dh-102 . ct")).toBe("DH102CT");
    });
  });
});

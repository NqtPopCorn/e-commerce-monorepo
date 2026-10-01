export const PAYMENT_CONSTANTS = {
  DEFAULT_BANK_BIN: "970422", // MB Bank
  DEFAULT_BANK_ID: "MB",
  DEFAULT_BANK_NAME: "MBBank (Ngan hang Quan Doi)",
  DEFAULT_TEMPLATE: "compact2",
  CODE_PREFIX: "DH",
  CURRENCY: "VND",
  CURRENCY_CODE: "704",
};

export const VIETQR_BANKS: Record<
  string,
  { bin: string; name: string; shortName: string }
> = {
  MB: { bin: "970422", name: "Ngân hàng Quân Đội", shortName: "MBBank" },
  VCB: {
    bin: "970436",
    name: "Ngân hàng Ngoại Thương Việt Nam",
    shortName: "Vietcombank",
  },
  CTG: {
    bin: "970415",
    name: "Ngân hàng Công Thương Việt Nam",
    shortName: "VietinBank",
  },
  TCB: {
    bin: "970407",
    name: "Ngân hàng Kỹ Thương Việt Nam",
    shortName: "Techcombank",
  },
  BIDV: {
    bin: "970418",
    name: "Ngân hàng Đầu tư và Phát triển Việt Nam",
    shortName: "BIDV",
  },
  ACB: { bin: "970416", name: "Ngân hàng Á Châu", shortName: "ACB" },
  VPB: {
    bin: "970432",
    name: "Ngân hàng Việt Nam Thịnh Vượng",
    shortName: "VPBank",
  },
  TPB: { bin: "970423", name: "Ngân hàng Tiên Phong", shortName: "TPBank" },
  STB: {
    bin: "970403",
    name: "Ngân hàng Sài Gòn Thương Tín",
    shortName: "Sacombank",
  },
  HDB: {
    bin: "970437",
    name: "Ngân hàng Phát triển TP.HCM",
    shortName: "HDBank",
  },
  VIB: { bin: "970441", name: "Ngân hàng Quốc tế Việt Nam", shortName: "VIB" },
  MSB: { bin: "970426", name: "Ngân hàng Hàng Hải Việt Nam", shortName: "MSB" },
  SHB: { bin: "970443", name: "Ngân hàng Sài Gòn - Hà Nội", shortName: "SHB" },
};

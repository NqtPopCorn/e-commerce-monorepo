/**
 * VietQR / NAPAS 247 payload builder (EMVCo Merchant-Presented QR).
 * Pure functions, no dependencies. Render the returned string with any QR library.
 *
 * Layout (ids must stay in ascending order):
 *   00 Payload format  "01"
 *   01 Initiation      "11" static (no amount) | "12" dynamic (has amount)
 *   38 Merchant account info (NAPAS)
 *        00 GUID "A000000727"
 *        01 Beneficiary org -> 00 acquirer BIN, 01 account/card number
 *        02 Service code "QRIBFTTA" (to account) | "QRIBFTTC" (to card)
 *   53 Currency "704" (VND)
 *   54 Amount
 *   58 Country "VN"
 *   62 Additional data -> 08 purpose of transaction (transfer content)
 *   63 CRC16-CCITT-FALSE over everything before the 4 hex digits (including "6304")
 */

export interface VietQrParams {
  /** 6-digit acquirer BIN, e.g. "970436" for Vietcombank. See references/vietqr.md */
  bin: string;
  /** Beneficiary account number (or card number when service = 'card') */
  accountNo: string;
  /** Integer VND. Omit/0 for a static QR where the payer types the amount. */
  amount?: number;
  /** Transfer content shown to the payer and returned in the bank statement. */
  addInfo?: string;
  service?: 'account' | 'card';
}

const tlv = (id: string, value: string): string => {
  if (value.length > 99) throw new Error(`VietQR field ${id} too long (${value.length})`);
  return id + value.length.toString().padStart(2, '0') + value;
};

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no xorout. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Strip Vietnamese diacritics and anything outside [A-Za-z0-9 ], cap length. */
export function sanitizeTransferContent(text: string, maxLen = 25): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function buildVietQrPayload(p: VietQrParams): string {
  if (!/^\d{6}$/.test(p.bin)) throw new Error('VietQR bin must be 6 digits');
  if (!/^[0-9A-Za-z]{1,19}$/.test(p.accountNo)) throw new Error('Invalid account number');

  const hasAmount = Number.isInteger(p.amount) && (p.amount as number) > 0;
  if (p.amount !== undefined && p.amount !== 0 && !hasAmount) {
    throw new Error('VietQR amount must be a positive integer (VND)');
  }

  const beneficiary = tlv('00', p.bin) + tlv('01', p.accountNo);
  const merchantInfo =
    tlv('00', 'A000000727') +
    tlv('01', beneficiary) +
    tlv('02', p.service === 'card' ? 'QRIBFTTC' : 'QRIBFTTA');

  let body =
    tlv('00', '01') +
    tlv('01', hasAmount ? '12' : '11') +
    tlv('38', merchantInfo) +
    tlv('53', '704');

  if (hasAmount) body += tlv('54', String(p.amount));
  body += tlv('58', 'VN');

  const info = p.addInfo ? sanitizeTransferContent(p.addInfo) : '';
  if (info) body += tlv('62', tlv('08', info));

  const withCrcHeader = body + '6304';
  return withCrcHeader + crc16(withCrcHeader);
}

/** Cheap structural check, useful in tests: verifies the trailing CRC. */
export function isValidVietQrPayload(payload: string): boolean {
  if (payload.length < 8 || payload.slice(-8, -4) !== '6304') return false;
  return crc16(payload.slice(0, -4)) === payload.slice(-4);
}

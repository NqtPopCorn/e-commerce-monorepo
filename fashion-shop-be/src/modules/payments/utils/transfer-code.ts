/**
 * Utility functions for generating, normalizing and extracting payment codes in bank memos.
 */

/**
 * Remove special characters, uppercase and squash spaces from a memo.
 */
export function squashMemo(memo: string): string {
  return (memo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Extract Order ID from bank transfer content.
 * Matches patterns like 'DH123', 'DH 123', 'ORDER123' or bank prefixes like 'VCB123.DH456.XYZ'.
 */
export function extractOrderIdFromMemo(
  memo: string,
  prefix = "DH",
): number | null {
  if (!memo) return null;

  // Search case-insensitively for the prefix followed by digits
  const regex = new RegExp(`${prefix}\\s*(\\d+)`, "i");
  const match = memo.match(regex);
  if (match && match[1]) {
    const id = parseInt(match[1], 10);
    return isNaN(id) ? null : id;
  }

  // Also try on squashed memo
  const squashed = squashMemo(memo);
  const squashedRegex = new RegExp(`${prefix.toUpperCase()}(\\d+)`);
  const squashedMatch = squashed.match(squashedRegex);
  if (squashedMatch && squashedMatch[1]) {
    const id = parseInt(squashedMatch[1], 10);
    return isNaN(id) ? null : id;
  }

  return null;
}

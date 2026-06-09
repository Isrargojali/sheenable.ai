/**
 * Format phone numbers for Pakistan format
 * Expected format: +92 3XX XXX XXXX
 */

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  // If starts with 92 (country code), remove it
  let digits = cleaned;
  if (digits.startsWith("92")) {
    digits = digits.slice(2);
  }

  // Keep only first 10 digits (0XXXXXXXXX or 3XXXXXXXXX)
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // Ensure it starts with 3 (mobile) or another valid prefix
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `+92 ${digits}`;
  if (digits.length <= 6) return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+92 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function isValidPakistaniPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Must be 12 digits with 92 prefix, or 10 digits without
  if (cleaned.startsWith("92")) {
    return cleaned.length === 12 && cleaned[2] === "3"; // 92-3XX-XXXXXXX
  }
  return cleaned.length === 10 && cleaned[0] === "3"; // 3XX-XXXXXXX
}

export function normalizePhoneForApi(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";
  // Ensure it starts with 92
  if (cleaned.startsWith("92")) {
    return cleaned;
  }
  return `92${cleaned}`;
}

/**
 * Format and mask CNIC for display
 */

export function maskCnic(cnic: string): string {
  if (!cnic) return "";
  // Format: 71501-3342343-2 -> 71501-XXXXXXX-2
  const cleaned = cnic.replace(/\D/g, "");
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 5)}-XXXXXXX-${cleaned.slice(-1)}`;
  }
  return cnic; // Return as-is if invalid format
}

export function unmaskCnic(cnic: string): string {
  // Simply return the original cnic - this is just for clarity in logic
  return cnic;
}

export function formatCnicInput(value: string): string {
  // Allow typing, format on display with maskCnic()
  // Remove non-digits and hyphens
  const cleaned = value.replace(/[^\d-]/g, "");
  if (cleaned.length <= 5) return cleaned;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
}

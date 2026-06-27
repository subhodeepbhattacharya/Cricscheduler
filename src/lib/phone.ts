// E.164: leading + then 8–15 digits, first digit non-zero.
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const DEFAULT_COUNTRY_CODE = "91"; // India — the app's primary audience.

export type PhoneResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

/**
 * Normalizes a user-entered phone number to E.164 (e.g. "+919876543210").
 * - Strips spaces, dashes, dots, and parentheses.
 * - If no country code (no leading "+"), assumes India (+91) after dropping
 *   any leading zeros.
 */
export function normalizePhone(
  raw: string | null | undefined,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE
): PhoneResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: false, error: "Please enter your phone number." };

  let cleaned = trimmed.replace(/[\s().-]/g, "");

  if (!cleaned.startsWith("+")) {
    cleaned = cleaned.replace(/^0+/, "");
    cleaned = `+${defaultCountryCode}${cleaned}`;
  }

  if (!E164_REGEX.test(cleaned)) {
    return {
      ok: false,
      error: "Enter a valid phone number with country code, e.g. +91 98765 43210.",
    };
  }

  return { ok: true, phone: cleaned };
}

/** Ensures a stored/display phone has a leading "+". */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.startsWith("+") ? phone : `+${phone}`;
}

/** Opens WhatsApp chat with a pre-filled message (wa.me deep link). */
export function buildWhatsAppNotifyUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

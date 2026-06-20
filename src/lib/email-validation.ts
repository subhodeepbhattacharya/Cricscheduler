import { resolveMx } from "dns/promises";

// Reasonable RFC-5321-ish format check (not exhaustive, but rejects junk).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Reserved / placeholder domains (RFC 2606 + common fakes) that can never
// receive mail.
const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "domain.com",
  "email.com",
  "mail.com",
  "localhost",
  "invalid",
]);

// Common disposable / throwaway providers. Not exhaustive, but covers the
// addresses people reach for when faking a signup.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "yopmail.net",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "fakeinbox.com",
  "tempinbox.com",
  "moakt.com",
  "emailondeck.com",
  "mintemail.com",
  "spam4.me",
  "mohmal.com",
  "tutanota-temp.com",
  "mailcatch.com",
  "inboxbear.com",
  "burnermail.io",
  "33mail.com",
  "anonaddy.com",
  "tempr.email",
  "discard.email",
  "mail-temp.com",
]);

export type EmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Synchronous, fast checks: format + reserved/disposable domain blocklist.
 * Returns the normalized (trimmed + lowercased) email when valid.
 */
export function validateEmailFormat(raw: string | null | undefined): EmailValidationResult {
  const email = (raw ?? "").trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const domain = email.split("@")[1];

  if (RESERVED_DOMAINS.has(domain)) {
    return { ok: false, error: "Please use a real email address." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      error: "Disposable email addresses aren't allowed. Please use a permanent email.",
    };
  }

  return { ok: true, email };
}

/**
 * Best-effort deliverability check via DNS MX lookup.
 * - true  -> domain can receive mail
 * - false -> domain definitively cannot receive mail (NXDOMAIN / no records)
 * - null  -> couldn't determine (transient DNS error); caller should allow
 */
export async function domainCanReceiveMail(domain: string): Promise<boolean | null> {
  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    return null;
  }
}

/**
 * Full signup email validation: format + blocklist, then deliverability.
 * Fails open on transient DNS errors so real users are never blocked by a
 * temporary lookup failure.
 */
export async function validateSignupEmail(raw: string | null | undefined): Promise<EmailValidationResult> {
  const formatResult = validateEmailFormat(raw);
  if (!formatResult.ok) return formatResult;

  const domain = formatResult.email.split("@")[1];
  const deliverable = await domainCanReceiveMail(domain);

  if (deliverable === false) {
    return { ok: false, error: "That email domain doesn't appear to exist. Please check and try again." };
  }

  return formatResult;
}

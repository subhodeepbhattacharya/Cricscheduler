interface RecaptchaVerifyResult {
  ok: boolean;
  error?: string;
}

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verifies a reCAPTCHA v3 token server-side.
 *
 * - If RECAPTCHA_SECRET_KEY is not configured, verification is skipped (returns
 *   ok) so local development works without keys. Configure keys in production.
 * - Checks Google's `success`, the score against RECAPTCHA_MIN_SCORE, and that
 *   the action matches the expected action.
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction: string
): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Not configured -> skip (keeps local/dev usable). Enforced once keys are set.
  if (!secret) return { ok: true };

  if (!token) {
    return { ok: false, error: "Captcha check failed. Please try again." };
  }

  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
      cache: "no-store",
    });

    const data = (await res.json()) as SiteVerifyResponse;

    if (!data.success) {
      return { ok: false, error: "Captcha verification failed. Please try again." };
    }

    if (data.action && data.action !== expectedAction) {
      return { ok: false, error: "Captcha verification failed. Please try again." };
    }

    if (typeof data.score === "number" && data.score < minScore) {
      return { ok: false, error: "Your request looked automated. Please try again." };
    }

    return { ok: true };
  } catch {
    // Fail closed on verification errors to avoid bypass.
    return { ok: false, error: "Could not verify captcha. Please try again." };
  }
}

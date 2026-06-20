"use client";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY || typeof window === "undefined") return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Executes reCAPTCHA v3 for the given action and returns a token.
 * Returns null when no site key is configured (dev) or on failure — the
 * server treats a missing token as a failure only when a secret is configured.
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") return null;
  try {
    await loadScript();
    await new Promise<void>((resolve) => window.grecaptcha!.ready(() => resolve()));
    return await window.grecaptcha!.execute(SITE_KEY, { action });
  } catch {
    return null;
  }
}

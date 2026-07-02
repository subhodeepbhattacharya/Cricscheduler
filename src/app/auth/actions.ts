"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { normalizePhone } from "@/lib/phone";

type Channel = "whatsapp" | "sms";

function safeNext(formData: FormData): string {
  const next = (formData.get("next") as string) || "";
  // Only allow same-site relative paths to avoid open redirects.
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/groups";
}

type SendOtpResult =
  | { ok: true; phone: string; channel: Channel }
  | { ok: false; error?: string };

export async function sendOtp(formData: FormData): Promise<SendOtpResult> {
  const captcha = await verifyRecaptcha(
    formData.get("recaptchaToken") as string | null,
    "send_otp"
  );
  if (!captcha.ok) return { ok: false, error: captcha.error };

  const normalized = normalizePhone(formData.get("phone") as string);
  if (!normalized.ok) return { ok: false, error: normalized.error };

  // In production we always request the "sms" channel so Supabase fires the
  // Send SMS Hook. The hook's Edge Function delivers the code over WhatsApp via
  // MSG91 — the user-facing copy says WhatsApp, but Supabase's channel must be
  // "sms" for the hook to trigger (the "whatsapp" channel bypasses the hook).
  const channel: Channel =
    process.env.NODE_ENV === "production" || formData.get("channel") === "sms"
      ? "sms"
      : "whatsapp";
  const name = ((formData.get("name") as string) || "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalized.phone,
    options: {
      channel,
      // Stored in user_metadata for new accounts; ignored for existing users.
      data: name ? { name } : undefined,
    },
  });

  if (error) {
    console.error("[sendOtp] signInWithOtp failed", {
      channel,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true, phone: normalized.phone, channel };
}

export async function verifyPhoneOtp(formData: FormData) {
  const normalized = normalizePhone(formData.get("phone") as string);
  if (!normalized.ok) return { error: normalized.error };

  const token = ((formData.get("token") as string) || "").trim();
  if (!/^\d{4,8}$/.test(token)) return { error: "Enter the code we sent you." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: normalized.phone,
    token,
    type: "sms", // phone OTP verifies with type 'sms' for both SMS and WhatsApp
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(safeNext(formData));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

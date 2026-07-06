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

  // WhatsApp OTP is delivered via the MSG91 Send SMS Hook, which only fires for
  // Supabase's "sms" channel (the "whatsapp" channel would bypass the hook and
  // use Supabase's native provider). So we always request "sms" — in every
  // environment — and the hook's Edge Function delivers the code over WhatsApp.
  // The user-facing copy still says WhatsApp because that's the real channel.
  const channel: Channel = "sms";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string | null | undefined): string | null {
  const email = (raw ?? "").trim().toLowerCase();
  return EMAIL_REGEX.test(email) ? email : null;
}

type SendEmailOtpResult =
  | { ok: true; email: string }
  | { ok: false; error?: string };

export async function sendEmailOtp(formData: FormData): Promise<SendEmailOtpResult> {
  const captcha = await verifyRecaptcha(
    formData.get("recaptchaToken") as string | null,
    "send_otp"
  );
  if (!captcha.ok) return { ok: false, error: captcha.error };

  const email = normalizeEmail(formData.get("email") as string);
  if (!email) return { ok: false, error: "Enter a valid email address." };

  const name = ((formData.get("name") as string) || "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Stored in user_metadata for new accounts; ignored for existing users.
      data: name ? { name } : undefined,
    },
  });

  if (error) {
    console.error("[sendEmailOtp] signInWithOtp failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true, email };
}

export async function verifyEmailOtp(formData: FormData) {
  const email = normalizeEmail(formData.get("email") as string);
  if (!email) return { error: "Enter a valid email address." };

  const token = ((formData.get("token") as string) || "").trim();
  if (!/^\d{4,8}$/.test(token)) return { error: "Enter the code we sent you." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
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

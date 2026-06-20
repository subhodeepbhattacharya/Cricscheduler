"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { validateSignupEmail, validateEmailFormat } from "@/lib/email-validation";

function safeNextValue(next: string): string {
  // Only allow same-site relative paths to avoid open redirects.
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/groups";
}

function safeNext(formData: FormData): string {
  return safeNextValue((formData.get("next") as string) || "");
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get("origin");
  if (fromHeader) return fromHeader;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export async function signUp(formData: FormData) {
  const captcha = await verifyRecaptcha(
    formData.get("recaptchaToken") as string | null,
    "signup"
  );
  if (!captcha.ok) return { error: captcha.error };

  const emailResult = await validateSignupEmail(formData.get("email") as string);
  if (!emailResult.ok) return { error: emailResult.error };
  const email = emailResult.email;

  const supabase = await createClient();
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const next = safeNext(formData);
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: origin
        ? `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
        : undefined,
    },
  });

  if (error) return { error: error.message };

  // Email confirmation enabled: user is created but no session yet.
  if (data.user && !data.session) {
    return {
      message:
        "Account created. Check your email and click the confirmation link to finish signing up.",
    };
  }

  redirect(next);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect(safeNext(formData));
}

export async function requestPasswordReset(formData: FormData) {
  const captcha = await verifyRecaptcha(
    formData.get("recaptchaToken") as string | null,
    "password_reset"
  );
  if (!captcha.ok) return { error: captcha.error };

  // Only block obviously-invalid formats; never reveal whether an account exists.
  const format = validateEmailFormat(formData.get("email") as string);
  if (!format.ok) return { error: format.error };

  const supabase = await createClient();
  const origin = await getOrigin();

  await supabase.auth.resetPasswordForEmail(format.email, {
    redirectTo: origin
      ? `${origin}/auth/confirm?next=${encodeURIComponent("/auth/reset-password")}`
      : undefined,
  });

  return {
    message: "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link is invalid or has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/groups");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

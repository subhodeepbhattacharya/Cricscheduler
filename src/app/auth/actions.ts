"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyRecaptcha } from "@/lib/recaptcha";

function safeNext(formData: FormData): string {
  const next = (formData.get("next") as string) || "";
  // Only allow same-site relative paths to avoid open redirects.
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/groups";
}

export async function signUp(formData: FormData) {
  const captcha = await verifyRecaptcha(
    formData.get("recaptchaToken") as string | null,
    "signup"
  );
  if (!captcha.ok) return { error: captcha.error };

  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: error.message };

  // Email confirmation enabled: user is created but no session yet
  if (data.user && !data.session) {
    return {
      message:
        "Account created. Check your email and click the confirmation link, then sign in.",
    };
  }

  redirect(safeNext(formData));
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect(safeNext(formData));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

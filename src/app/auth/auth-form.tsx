"use client";

import { useState } from "react";
import { signIn, signUp, requestPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRecaptcha } from "@/lib/recaptcha-client";

type Mode = "signin" | "signup" | "forgot";

export function AuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "forgot") {
      const token = await executeRecaptcha("password_reset");
      if (token) formData.set("recaptchaToken", token);
      const result = await requestPasswordReset(formData);
      if (result?.error) setError(result.error);
      else if (result?.message) setMessage(result.message);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const token = await executeRecaptcha("signup");
      if (token) formData.set("recaptchaToken", token);
    }

    const action = mode === "signin" ? signIn : signUp;
    const result = await action(formData);
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result && "message" in result && result.message) {
      setMessage(result.message);
      setMode("signin");
      setLoading(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reset your password</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <Input label="Email" name="email" type="email" required placeholder="you@example.com" />

          {message && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>

        <button
          type="button"
          onClick={() => switchMode("signin")}
          className="mt-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "signin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "signup" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Sign up
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <Input label="Name" name="name" type="text" required placeholder="Your name" />
        )}
        <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Min 6 characters"
        />

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Forgot password?
          </button>
        )}

        {message && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" size="lg" loading={loading}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}

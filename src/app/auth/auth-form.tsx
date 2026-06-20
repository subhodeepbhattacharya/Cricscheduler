"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeRecaptcha } from "@/lib/recaptcha-client";

export function AuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
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

  return (
    <div>
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === "signin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
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

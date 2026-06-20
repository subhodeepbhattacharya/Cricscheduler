"use client";

import { useState } from "react";
import { updatePassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;
    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const result = await updatePassword(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        label="New password"
        name="password"
        type="password"
        required
        minLength={6}
        placeholder="Min 6 characters"
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        required
        minLength={6}
        placeholder="Re-enter password"
      />

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Button type="submit" size="lg" loading={loading}>
        Update password
      </Button>
    </form>
  );
}

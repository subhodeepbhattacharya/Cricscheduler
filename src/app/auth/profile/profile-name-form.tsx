"use client";

import { useState, type FormEvent } from "react";
import { setProfileName } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileNameForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (next) formData.set("next", next);

    const result = await setProfileName(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Your name"
        name="name"
        type="text"
        required
        autoComplete="name"
        placeholder="e.g. Rahul Sharma"
        minLength={2}
        maxLength={80}
      />
      <p className="text-xs text-gray-500">
        Group members and match hosts see this name on RSVPs and team lists.
      </p>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <Button type="submit" size="lg" loading={loading}>
        Continue
      </Button>
    </form>
  );
}

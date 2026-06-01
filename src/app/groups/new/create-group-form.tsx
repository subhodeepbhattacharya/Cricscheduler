"use client";

import { useState } from "react";
import { createGroup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input label="Group name" name="name" required placeholder="e.g. Weekend Warriors" />
      <Textarea label="Description" name="description" rows={3} placeholder="Optional description" />
      <Input
        label="WhatsApp group link"
        name="whatsappGroupLink"
        type="url"
        placeholder="https://chat.whatsapp.com/..."
      />
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" size="lg" loading={loading}>
        Create group
      </Button>
    </form>
  );
}

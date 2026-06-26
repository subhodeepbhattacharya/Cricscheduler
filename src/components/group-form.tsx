"use client";

import { useState } from "react";
import { createGroup, updateGroup } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { Group } from "@/lib/types/database";

type GroupFormProps =
  | { mode: "create"; group?: never }
  | { mode: "edit"; group: Group };

export function GroupForm({ mode, group }: GroupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result =
      mode === "create" ? await createGroup(formData) : await updateGroup(group.id, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        label="Group name"
        name="name"
        required
        placeholder="e.g. Weekend Warriors"
        defaultValue={group?.name}
      />
      <Textarea
        label="Description"
        name="description"
        rows={3}
        placeholder="Optional description"
        defaultValue={group?.description ?? ""}
      />
      <Input
        label="WhatsApp group link (optional)"
        name="whatsappGroupLink"
        type="text"
        inputMode="url"
        placeholder="https://chat.whatsapp.com/..."
        defaultValue={group?.whatsapp_group_link ?? ""}
      />
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" size="lg" loading={loading}>
        {mode === "create" ? "Create group" : "Save changes"}
      </Button>
    </form>
  );
}

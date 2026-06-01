"use client";

import { useState } from "react";
import { createMatch } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";
import { Input, Toggle } from "@/components/ui/input";

export function CreateMatchForm({ groupId }: { groupId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prepaymentRequired, setPrepaymentRequired] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (prepaymentRequired) formData.set("prepaymentRequired", "on");
    const result = await createMatch(groupId, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input label="Match title" name="title" required placeholder="e.g. Sunday Morning Match" />
      <Input label="Date" name="date" type="date" required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start time" name="startTime" type="time" required />
        <Input label="End time" name="endTime" type="time" required />
      </div>
      <Input label="Location name" name="locationName" required placeholder="e.g. Central Ground" />
      <Input
        label="Location address"
        name="locationAddress"
        required
        placeholder="Full address"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Max players" name="maxPlayers" type="number" min={2} required defaultValue={14} />
        <Input
          label="Fee per player (₹)"
          name="feePerPlayer"
          type="number"
          min={0}
          step={1}
          defaultValue={0}
        />
      </div>
      <Toggle
        label="Require UPI prepayment"
        checked={prepaymentRequired}
        onChange={setPrepaymentRequired}
        description="Players must pay before their spot is confirmed"
      />
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" size="lg" loading={loading}>
        Create match
      </Button>
    </form>
  );
}

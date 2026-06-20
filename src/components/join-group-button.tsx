"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestToJoinGroup } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";

export function JoinGroupButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    const result = await requestToJoinGroup(token);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setStatus(result.status ?? null);
    setLoading(false);
    router.refresh();
  }

  if (status === "ACTIVE") {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
        You&apos;re already a member of this group.
      </p>
    );
  }

  if (status === "PENDING" || status === "REQUESTED") {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Request sent. The group host will review and approve your request.
      </p>
    );
  }

  return (
    <div>
      <Button size="lg" onClick={handleJoin} loading={loading}>
        Request to join
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

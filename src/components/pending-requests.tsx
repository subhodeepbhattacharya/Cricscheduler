"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveJoinRequest, denyJoinRequest } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";

export interface PendingRequest {
  membership_id: string;
  user_id: string;
  name: string;
  email: string;
  requested_at: string;
}

export function PendingRequests({
  groupId,
  requests,
}: {
  groupId: string;
  requests: PendingRequest[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handle(action: "approve" | "deny", membershipId: string) {
    setPendingId(membershipId);
    setError(null);
    const result =
      action === "approve"
        ? await approveJoinRequest(membershipId, groupId)
        : await denyJoinRequest(membershipId, groupId);
    if (result?.error) {
      setError(result.error);
    }
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Join requests
        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {requests.length}
        </span>
      </h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 space-y-2">
        {requests.map((req) => (
          <div
            key={req.membership_id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{req.name}</p>
              <p className="truncate text-xs text-gray-500">{req.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handle("deny", req.membership_id)}
                loading={pendingId === req.membership_id}
                className="text-red-700 hover:text-red-800"
              >
                Deny
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handle("approve", req.membership_id)}
                loading={pendingId === req.membership_id}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

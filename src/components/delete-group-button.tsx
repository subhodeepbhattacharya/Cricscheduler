"use client";

import { useState } from "react";
import { deleteGroup } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";

export function DeleteGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteGroup(groupId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-right">
        <p className="text-xs text-red-700">
          Delete <span className="font-semibold">{groupName}</span>? This permanently removes all
          matches, RSVPs, payments and memberships.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={loading}
            onClick={handleDelete}
          >
            Yes, delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-red-700 hover:text-red-800"
      >
        Delete group
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

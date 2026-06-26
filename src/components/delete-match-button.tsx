"use client";

import { useState } from "react";
import { deleteMatch } from "@/app/matches/actions";
import { Button } from "@/components/ui/button";

export function DeleteMatchButton({
  matchId,
  matchTitle,
  variant = "secondary",
}: {
  matchId: string;
  matchTitle: string;
  variant?: "secondary" | "ghost" | "danger";
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteMatch(matchId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs text-red-700">
          Delete <span className="font-semibold">{matchTitle}</span>? This cannot be undone and
          removes all RSVPs and payment records for this match.
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
    <div>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={() => setConfirming(true)}
        className={variant === "danger" ? undefined : "text-red-700 hover:text-red-800"}
      >
        Delete
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

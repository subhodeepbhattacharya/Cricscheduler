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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${matchTitle}"? This cannot be undone and will remove all RSVPs and payment records for this match.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    const result = await deleteMatch(matchId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant={variant}
        size="sm"
        loading={loading}
        onClick={handleDelete}
        className={variant === "danger" ? undefined : "text-red-700 hover:text-red-800"}
      >
        Delete
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

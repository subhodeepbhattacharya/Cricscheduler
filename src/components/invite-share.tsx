"use client";

import { useEffect, useState } from "react";
import { regenerateInvite } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";

export function InviteShare({
  groupId,
  initialToken,
}: {
  groupId: string;
  initialToken: string;
}) {
  const [token, setToken] = useState(initialToken);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/groups/join/${token}` : `/groups/join/${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Select and copy the link manually.");
    }
  }

  async function handleRegenerate() {
    const confirmed = window.confirm(
      "Generate a new invite link? The current link will stop working immediately."
    );
    if (!confirmed) return;

    setRegenerating(true);
    setError(null);
    const result = await regenerateInvite(groupId);
    if (result?.error) {
      setError(result.error);
    } else if (result?.token) {
      setToken(result.token);
    }
    setRegenerating(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Invite link</h3>
      <p className="mt-1 text-xs text-gray-500">
        Share this link inside your WhatsApp group. People who open it can request to join, and
        you approve each request.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700"
        />
        <Button type="button" size="sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <div className="mt-2">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {regenerating ? "Generating…" : "Generate new link (revokes old)"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

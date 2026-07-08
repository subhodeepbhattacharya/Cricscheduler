"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type MatchShareLinkProps = {
  matchId: string;
  compact?: boolean;
};

export function MatchShareLink({ matchId, compact = false }: MatchShareLinkProps) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/matches/${matchId}` : `/matches/${matchId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Select and copy the link manually.");
    }
  }

  if (compact) {
    return (
      <div>
        <p className="text-xs font-medium text-gray-700">Match link</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-700"
          />
          <Button type="button" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">Share match link</h3>
      <p className="mt-1 text-xs text-gray-500">
        Send this link in your WhatsApp group so members can open the match and confirm their spot.
        They must already be in the group and signed in.
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
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

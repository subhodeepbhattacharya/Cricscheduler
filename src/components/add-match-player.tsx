"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addParticipantToMatch } from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import type { MatchAddCandidate } from "@/lib/match-logic";

interface AddMatchPlayerProps {
  matchId: string;
  candidates: MatchAddCandidate[];
  addPlayerReady: boolean;
}

export function AddMatchPlayer({ matchId, candidates, addPlayerReady }: AddMatchPlayerProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAdd() {
    if (!selectedUserId || !addPlayerReady) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await addParticipantToMatch(matchId, selectedUserId);
    if (result?.error) {
      setError(result.error);
    } else {
      setSelectedUserId("");
      setSuccess(
        result.status === "STANDBY"
          ? "Player added to standby (match is full)."
          : "Player confirmed."
      );
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/40 p-4">
      <h3 className="text-sm font-semibold text-gray-900">Add player</h3>
      <p className="mt-1 text-xs text-gray-600">
        Add a group member who has not RSVP&apos;d. They are confirmed directly (offline
        payment is fine when prepayment is enabled).
      </p>

      {!addPlayerReady && (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Database setup required: run{" "}
          <code className="font-mono">supabase/migrations/023_add_participant_rpc.sql</code> in
          the Supabase SQL Editor before adding players.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-gray-600">Group member</span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loading || !addPlayerReady || candidates.length === 0}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">
              {candidates.length === 0
                ? "No members available to add"
                : "Select a member…"}
            </option>
            {candidates.map((c) => (
              <option key={c.user_id} value={c.user_id}>
                {c.name}
                {c.phone ? ` · ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={handleAdd}
          loading={loading}
          disabled={!selectedUserId || loading || !addPlayerReady}
        >
          Add to match
        </Button>
      </div>

      {candidates.length === 0 && addPlayerReady && (
        <p className="mt-2 text-xs text-gray-500">
          Every active group member is already confirmed or on standby for this match.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-700">{success}</p>}
    </div>
  );
}

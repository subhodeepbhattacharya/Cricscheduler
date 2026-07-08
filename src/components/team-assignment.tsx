"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { assignParticipantTeam, updateMatchTeamNames } from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_TEAM_A_NAME,
  DEFAULT_TEAM_B_NAME,
  resolveTeamDisplayName,
} from "@/lib/utils";
import type { MatchTeam, ParticipationWithUser } from "@/lib/types/database";

type Props = {
  matchId: string;
  matchStatus: string;
  teamAName: string | null;
  teamBName: string | null;
  confirmed: ParticipationWithUser[];
};

function TeamColumn({
  label,
  accent,
  players,
  loadingId,
  onUnassign,
}: {
  label: string;
  accent: "blue" | "green";
  players: ParticipationWithUser[];
  loadingId: string | null;
  onUnassign: (participationId: string) => void;
}) {
  const headerClass =
    accent === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : "border-green-200 bg-green-50 text-green-900";

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white">
      <div className={`rounded-t-xl border-b px-3 py-2 text-sm font-semibold ${headerClass}`}>
        {label}
        <span className="ml-1 font-normal opacity-75">({players.length})</span>
      </div>
      <ul className="space-y-2 p-2">
        {players.length === 0 ? (
          <li className="px-1 py-2 text-xs text-gray-400">No players yet</li>
        ) : (
          players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
            >
              <span
                className="min-w-0 truncate text-sm font-medium text-gray-900"
                title={p.user.name}
              >
                {p.user.name}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 px-2 text-xs text-gray-500"
                title="Unassign player"
                loading={loadingId === p.id}
                onClick={() => onUnassign(p.id)}
              >
                ✕
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function TeamAssignment({
  matchId,
  matchStatus,
  teamAName,
  teamBName,
  confirmed,
}: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [savingNames, setSavingNames] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayA = resolveTeamDisplayName(teamAName, DEFAULT_TEAM_A_NAME);
  const displayB = resolveTeamDisplayName(teamBName, DEFAULT_TEAM_B_NAME);

  const [nameAInput, setNameAInput] = useState(teamAName?.trim() ?? "");
  const [nameBInput, setNameBInput] = useState(teamBName?.trim() ?? "");

  useEffect(() => {
    setNameAInput(teamAName?.trim() ?? "");
    setNameBInput(teamBName?.trim() ?? "");
  }, [teamAName, teamBName]);

  const assignedCount = useMemo(
    () => confirmed.filter((p) => p.team === "A" || p.team === "B").length,
    [confirmed]
  );

  const [expanded, setExpanded] = useState(assignedCount > 0);

  const teamA = confirmed.filter((p) => p.team === "A");
  const teamB = confirmed.filter((p) => p.team === "B");
  const unassigned = confirmed.filter((p) => !p.team);

  const namesDirty =
    nameAInput.trim() !== (teamAName?.trim() ?? "") ||
    nameBInput.trim() !== (teamBName?.trim() ?? "");

  if (matchStatus !== "SCHEDULED" || confirmed.length === 0) {
    return null;
  }

  async function handleAssign(participationId: string, team: MatchTeam | null) {
    setLoadingId(participationId);
    setError(null);

    const result = await assignParticipantTeam(participationId, matchId, team);
    if (result?.error) {
      setError(result.error);
    }

    setLoadingId(null);
    router.refresh();
  }

  async function handleSaveNames() {
    setSavingNames(true);
    setError(null);

    const result = await updateMatchTeamNames(matchId, nameAInput, nameBInput);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }

    setSavingNames(false);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
      >
        <div>
          <p className="font-semibold text-gray-900">Teams (optional)</p>
          <p className="text-xs text-gray-500">
            {assignedCount > 0
              ? `${assignedCount} of ${confirmed.length} assigned · ${displayA} vs ${displayB}`
              : `Split confirmed players into ${displayA} and ${displayB}`}
          </p>
        </div>
        <span
          className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/50 p-3">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Team names
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-gray-600">Side A</span>
                <input
                  type="text"
                  value={nameAInput}
                  onChange={(e) => setNameAInput(e.target.value)}
                  placeholder={DEFAULT_TEAM_A_NAME}
                  maxLength={40}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600">Side B</span>
                <input
                  type="text"
                  value={nameBInput}
                  onChange={(e) => setNameBInput(e.target.value)}
                  placeholder={DEFAULT_TEAM_B_NAME}
                  maxLength={40}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={savingNames}
                disabled={!namesDirty}
                onClick={handleSaveNames}
              >
                Save names
              </Button>
              {namesDirty && (
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setNameAInput(teamAName?.trim() ?? "");
                    setNameBInput(teamBName?.trim() ?? "");
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <TeamColumn
              label={displayA}
              accent="blue"
              players={teamA}
              loadingId={loadingId}
              onUnassign={(id) => handleAssign(id, null)}
            />
            <TeamColumn
              label={displayB}
              accent="green"
              players={teamB}
              loadingId={loadingId}
              onUnassign={(id) => handleAssign(id, null)}
            />
          </div>

          {unassigned.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Unassigned ({unassigned.length})
              </p>
              <ul className="space-y-2">
                {unassigned.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
                  >
                    <span
                      className="min-w-0 truncate text-sm font-medium text-gray-900"
                      title={p.user.name}
                    >
                      {p.user.name}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="max-w-[7rem] truncate"
                        title={`Assign to ${displayA}`}
                        loading={loadingId === p.id}
                        onClick={() => handleAssign(p.id, "A")}
                      >
                        {displayA}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="max-w-[7rem] truncate"
                        title={`Assign to ${displayB}`}
                        loading={loadingId === p.id}
                        onClick={() => handleAssign(p.id, "B")}
                      >
                        {displayB}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import {
  DEFAULT_TEAM_A_NAME,
  DEFAULT_TEAM_B_NAME,
  resolveTeamDisplayName,
} from "@/lib/utils";

export type TeamRosterPlayer = {
  userId: string;
  name: string;
};

type Props = {
  teamAName: string | null;
  teamBName: string | null;
  teamA: TeamRosterPlayer[];
  teamB: TeamRosterPlayer[];
  unassigned: TeamRosterPlayer[];
  currentUserId: string;
};

function TeamList({
  label,
  accent,
  players,
  currentUserId,
}: {
  label: string;
  accent: "blue" | "green";
  players: TeamRosterPlayer[];
  currentUserId: string;
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
      <ul className="space-y-1 p-2">
        {players.length === 0 ? (
          <li className="px-1 py-2 text-xs text-gray-400">No players assigned</li>
        ) : (
          players.map((player) => (
            <li
              key={player.userId}
              className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm text-gray-900"
            >
              {player.name}
              {player.userId === currentUserId && (
                <span className="ml-1 text-xs font-normal text-gray-400">(you)</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function MatchTeamsDisplay({
  teamAName,
  teamBName,
  teamA,
  teamB,
  unassigned,
  currentUserId,
}: Props) {
  const displayA = resolveTeamDisplayName(teamAName, DEFAULT_TEAM_A_NAME);
  const displayB = resolveTeamDisplayName(teamBName, DEFAULT_TEAM_B_NAME);

  const assignedCount = teamA.length + teamB.length;
  const hasCustomNames = Boolean(teamAName?.trim() || teamBName?.trim());

  if (assignedCount === 0 && !hasCustomNames) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Teams</h2>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <TeamList
            label={displayA}
            accent="blue"
            players={teamA}
            currentUserId={currentUserId}
          />
          <TeamList
            label={displayB}
            accent="green"
            players={teamB}
            currentUserId={currentUserId}
          />
        </div>

        {unassigned.length > 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Unassigned ({unassigned.length})
            </p>
            <ul className="flex flex-wrap gap-2">
              {unassigned.map((player) => (
                <li
                  key={player.userId}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-sm text-gray-800"
                >
                  {player.name}
                  {player.userId === currentUserId && (
                    <span className="ml-1 text-xs text-gray-400">(you)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

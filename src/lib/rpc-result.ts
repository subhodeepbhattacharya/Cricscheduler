import type { MatchJoinContext } from "@/components/match-join-gate";
import type { Match } from "@/lib/types/database";

export function firstRpcRow<T>(data: T | T[] | null | undefined): T | null {
  if (data == null) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export function isMatch(value: unknown): value is Match {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Match).id === "string" &&
    typeof (value as Match).group_id === "string" &&
    typeof (value as Match).title === "string"
  );
}

export function normalizeMatchRpc(data: unknown): Match | null {
  const row = firstRpcRow(data as Match | Match[] | null | undefined);
  return isMatch(row) ? row : null;
}

export function isMatchJoinContext(value: unknown): value is MatchJoinContext {
  if (!value || typeof value !== "object") return false;
  const context = value as MatchJoinContext;
  return (
    typeof context.group_id === "string" &&
    typeof context.group_name === "string" &&
    typeof context.match_title === "string" &&
    typeof context.invite_token === "string"
  );
}

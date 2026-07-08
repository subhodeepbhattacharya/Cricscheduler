// The app's audience is India; match date/time are entered as IST wall-clock.
// Interpreting them with a fixed IST offset makes "has it started?" correct
// regardless of where the server runs (e.g. Vercel in UTC).
const APP_TZ_OFFSET = "+05:30";

/** Epoch ms for a match's start instant, treating the stored time as IST. */
export function getMatchStartMs(dateStr: string, startTime: string | null | undefined): number {
  const hhmm = (startTime ?? "00:00").slice(0, 5);
  return new Date(`${dateStr}T${hhmm}:00${APP_TZ_OFFSET}`).getTime();
}

/** True once a match's scheduled start date/time has passed. */
export function isMatchElapsed(dateStr: string, startTime: string | null | undefined): boolean {
  const startMs = getMatchStartMs(dateStr, startTime);
  return !Number.isNaN(startMs) && startMs < Date.now();
}

/** Local calendar date as YYYY-MM-DD (avoid UTC off-by-one in date filters). */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateTransactionRef(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CS-${timestamp}-${random}`.toUpperCase();
}

export function buildUpiIntentUrl(params: {
  vpa: string;
  amount: number;
  transactionRef: string;
  note: string;
}): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "CricScheduler";
  const searchParams = new URLSearchParams({
    pa: params.vpa,
    pn: appName,
    am: params.amount.toFixed(2),
    cu: "INR",
    tn: params.note,
    tr: params.transactionRef,
  });
  return `upi://pay?${searchParams.toString()}`;
}

/** Normalize and validate a UPI Virtual Payment Address (e.g. name@okicici). */
export function normalizeUpiVpa(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUpiVpa(vpa: string): boolean {
  return /^[a-z0-9._-]{2,256}@[a-z0-9._-]{2,64}$/i.test(vpa);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMatchFee(feePerPlayer: number): string {
  return Number(feePerPlayer) > 0
    ? formatCurrency(Number(feePerPlayer))
    : "Fee: Managed offline";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMatchTime(startTime: string, endTime?: string | null): string {
  if (!startTime) return "";
  const start = formatTime(startTime);
  if (!endTime) return start;
  const startKey = startTime.slice(0, 5);
  const endKey = endTime.slice(0, 5);
  if (startKey === endKey) return start;
  return `${start} – ${formatTime(endTime)}`;
}

export const DEFAULT_TEAM_A_NAME = "Team A";
export const DEFAULT_TEAM_B_NAME = "Team B";
export const TEAM_NAME_MAX_LENGTH = 40;

export function normalizeOptionalTeamName(
  name: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = name.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > TEAM_NAME_MAX_LENGTH) {
    return { ok: false, error: `Team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer` };
  }
  return { ok: true, value: trimmed };
}

export function resolveTeamDisplayName(stored: string | null | undefined, fallback: string): string {
  const trimmed = stored?.trim();
  return trimmed || fallback;
}

const PLACEHOLDER_NAMES = new Set(["player", "unknown", "user"]);

export function normalizeProfileName(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

export function isValidProfileName(raw: string | null | undefined): boolean {
  const name = normalizeProfileName(raw);
  if (name.length < 2) return false;
  if (name.length > 80) return false;
  if (PLACEHOLDER_NAMES.has(name.toLowerCase())) return false;
  return true;
}

export function needsProfileName(
  profileName: string | null | undefined,
  user?: { user_metadata?: { name?: string } }
): boolean {
  if (isValidProfileName(profileName)) return false;
  if (isValidProfileName(user?.user_metadata?.name)) return false;
  return true;
}

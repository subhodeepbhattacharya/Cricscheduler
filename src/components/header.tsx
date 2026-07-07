import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/auth";
import { isValidProfileName, normalizeProfileName } from "@/lib/profile-name";

function displayName(
  profile: { name: string } | null,
  user: { user_metadata?: { name?: string } }
): string | null {
  const fromProfile = normalizeProfileName(profile?.name);
  if (isValidProfileName(fromProfile)) return fromProfile;
  const fromMeta = normalizeProfileName(user.user_metadata?.name as string | undefined);
  if (isValidProfileName(fromMeta)) return fromMeta;
  return null;
}

export async function Header() {
  let user = null;
  let name: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
    if (user) {
      const profile = await getUserProfile(user.id);
      name = displayName(profile, user);
    }
  } catch {
    // Avoid taking down the whole page if auth/session refresh fails.
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="text-xl">🏏</span>
            <span className="font-bold text-green-700">CricScheduler</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm">
            {user ? (
              <>
                <Link href="/groups" className="text-gray-600 hover:text-green-700">
                  My Groups
                </Link>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="text-gray-500 hover:text-gray-700">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/auth" className="font-medium text-green-700 hover:text-green-800">
                Sign in
              </Link>
            )}
          </nav>
        </div>
        {user && name && (
          <p className="mt-2 truncate text-sm text-gray-600">
            Welcome, {name}
          </p>
        )}
      </div>
    </header>
  );
}

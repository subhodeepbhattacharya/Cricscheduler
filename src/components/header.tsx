import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Avoid taking down the whole page if auth/session refresh fails.
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🏏</span>
          <span className="font-bold text-green-700">CricScheduler</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
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
    </header>
  );
}

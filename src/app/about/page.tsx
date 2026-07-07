import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { ObfuscatedEmail } from "@/components/obfuscated-email";

export const metadata = {
  title: "About — CricScheduler",
  description: "Learn how CricScheduler helps amateur cricket groups schedule matches and manage RSVPs.",
};

export default async function AboutPage() {
  const user = await getCurrentUser();

  return (
    <div className="pb-4">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>

      <div className="mt-4 text-center">
        <div className="text-5xl">🏏</div>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">About CricScheduler</h1>
        <p className="mt-2 text-sm text-gray-600">
          A mobile-first app for amateur cricket groups who coordinate on WhatsApp.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Built and operated by OneEightAI Labs.
        </p>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">What we do</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          CricScheduler replaces the endless WhatsApp threads about who&apos;s playing, when, and
          where. Members schedule matches with date, time, and location; players confirm, join
          standby when full, or decline in one tap. Hosts can verify optional UPI prepayment,
          assign teams, add players who haven&apos;t RSVP&apos;d, and share a direct match link back
          to the group chat.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">1. Create a group</span>
            <p className="mt-1">
              A group usually maps to one WhatsApp cricket crew. You can link the WhatsApp chat
              (optional) and share an invite link for others to request to join. The host can
              promote trusted players to co-host (up to five hosts and co-hosts combined) so they
              can help run the group.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">2. Schedule matches</span>
            <p className="mt-1">
              Any approved group member can create a match — set date, time, venue, player limit, and
              optional fee. When prepayment is enabled, the match creator enters their own UPI ID so
              players pay the host directly. Upcoming matches are grouped by day with start times
              shown clearly; each card shows who created the match. Past matches stay in a collapsed
              section for reference.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">3. RSVP, pay &amp; share</span>
            <p className="mt-1">
              Players confirm, join standby when the match is full, or decline. If someone drops out,
              the next standby player is promoted automatically. Dropped-out players can rejoin while
              the match is still open. If prepayment is required, they pay via UPI and the host
              verifies before confirming the spot. Signed-in members can copy a share match link to
              paste in WhatsApp.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">4. Manage participants</span>
            <p className="mt-1">
              The host, co-host, or person who created the match can open Manage match to promote
              standby players, mark drop-outs, verify payments, and add group members who have not
              RSVP&apos;d yet (confirmed directly when spots remain, or standby if full).
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">5. Teams (optional)</span>
            <p className="mt-1">
              Hosts and co-hosts can assign confirmed players to two sides and rename the teams
              (e.g. Kings vs Knights). The lineup appears on the match page for everyone in the
              group.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Sign in with WhatsApp or email</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Sign up or sign in with a one-time code sent on WhatsApp (preferred) or to your email — no
          passwords. WhatsApp is the default; email is available as a fallback. When you sign up, you
          must enter your real name so teammates recognize you on RSVPs and team lists. If you sign in
          for the first time without a name, you&apos;ll be asked to add one before using groups.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Groups &amp; WhatsApp</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Most groups are tied to a WhatsApp chat, but the link is optional. Join requests show the
          player&apos;s phone number (when available) and are approved by the host or co-host — we
          don&apos;t verify WhatsApp membership automatically, so hosts should only approve people
          they know from the group. After approve or deny, hosts can optionally notify the player on
          WhatsApp. The group host can edit group details, review members, promote co-hosts, and
          remove someone from the group if needed. Co-hosts share most host powers except promoting
          other co-hosts.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Questions or feedback?</h2>
        <p className="mt-2 text-sm text-gray-600">
          For support or licensing inquiries, email <ObfuscatedEmail />.
        </p>
      </section>

      <div className="mt-8 text-center">
        {user ? (
          <Link href="/groups" className={buttonVariants({ size: "lg" })}>
            Go to my groups
          </Link>
        ) : (
          <>
            <Link href="/auth" className={buttonVariants({ size: "lg" })}>
              Sign in
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Or{" "}
              <Link href="/auth?mode=signup" className="font-medium text-green-700 hover:underline">
                sign up instead
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

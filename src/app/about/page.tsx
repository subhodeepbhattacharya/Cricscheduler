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
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">What we do</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          CricScheduler replaces the endless WhatsApp threads about who&apos;s playing, when, and
          where. Members schedule matches with date, time, and location; players confirm, join
          standby when full, or decline in one tap; optional UPI prepayment keeps spots fair. Hosts
          can optionally split confirmed players into two named teams so everyone sees the lineup
          before they arrive.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">1. Create a group</span>
            <p className="mt-1">
              A group usually maps to one WhatsApp cricket crew. You can link the WhatsApp chat
              (optional) and share an invite link for others to request to join.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">2. Schedule matches</span>
            <p className="mt-1">
              Any approved group member can create a match — set date, time, venue, player limit, and
              optional fee. Upcoming matches are grouped by day (with start times shown clearly); past
              matches stay in a collapsed section for reference.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">3. RSVP &amp; pay</span>
            <p className="mt-1">
              Players confirm, join standby when the match is full, or decline. If someone drops out,
              the next standby player is promoted automatically. Dropped-out players can rejoin while
              the match is still open. If prepayment is required, they pay via UPI and the host
              verifies before confirming the spot.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">4. Teams (optional)</span>
            <p className="mt-1">
              Hosts and co-hosts can assign confirmed players to two sides and rename the teams
              (e.g. Kings vs Knights). The lineup appears on the match page for everyone in the
              group.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Sign in with your phone</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Sign up or sign in with a one-time code sent by SMS or WhatsApp — no passwords. New numbers
          create an account automatically when you sign up.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Groups &amp; WhatsApp</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Most groups are tied to a WhatsApp chat, but the link is optional. Join requests show the
          player&apos;s phone number and are approved by the host — we don&apos;t verify WhatsApp
          membership automatically, so hosts should only approve people they know from the group.
          After approve or deny, hosts can optionally notify the player on WhatsApp. Hosts and
          co-hosts can edit group details, review members, and remove someone from the group if
          needed.
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

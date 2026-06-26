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
          where. Hosts schedule matches with date, time, and location; players confirm or decline in
          one tap; optional UPI prepayment keeps spots fair.
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
              Set date, time, venue, player limit, and optional match fee. Upcoming matches are
              grouped by day so everyone sees what&apos;s on.
            </p>
          </li>
          <li className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="font-medium text-gray-900">3. RSVP &amp; pay</span>
            <p className="mt-1">
              Players confirm, join standby, or decline. If prepayment is required, they pay via UPI
              and the host verifies before confirming the spot.
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
          Most groups are tied to a WhatsApp chat, but the link is optional. Join requests are
          approved by the host — we don&apos;t verify WhatsApp membership automatically, so hosts
          should only approve people they know from the group.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Questions or feedback?</h2>
        <p className="mt-2 text-sm text-gray-600">
          For support or licensing inquiries, email <ObfuscatedEmail />.
        </p>
      </section>

      <div className="mt-8 text-center">
        <Link href={user ? "/groups" : "/auth"} className={buttonVariants({ size: "lg" })}>
          {user ? "Go to my groups" : "Get started"}
        </Link>
      </div>
    </div>
  );
}

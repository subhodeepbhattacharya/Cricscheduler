import Link from "next/link";
import { ObfuscatedEmail } from "@/components/obfuscated-email";

export const metadata = {
  title: "Terms of Service — CricScheduler",
  description: "Terms and conditions for using the CricScheduler web application.",
};

export default function TermsPage() {
  return (
    <div className="pb-4">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: July 2026</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          These terms govern your use of CricScheduler (&quot;the Service&quot;), operated by
          Subhodeep B. By creating an account or using the Service, you agree to these terms. If you
          do not agree, do not use the Service.
        </p>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">The Service</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          CricScheduler helps amateur cricket groups schedule matches, manage RSVPs and standby
          lists, optionally collect UPI prepayments, and share team lineups. The Service is provided
          on an &quot;as is&quot; and &quot;as available&quot; basis. We may change, suspend, or
          discontinue features at any time.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
          <li>You sign in with a one-time code sent to your email or your phone via WhatsApp.</li>
          <li>You must provide accurate information (such as your name) and keep access to your email or phone secure.</li>
          <li>You are responsible for activity under your account.</li>
          <li>One person should not share an account; each player should use their own email or phone number.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Groups &amp; hosts</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Groups are managed by hosts and co-hosts. Hosts decide who may join, may remove members, and
          can verify payments or assign teams. Hosts are responsible for approving only people they
          know from their real-world cricket group. CricScheduler does not verify WhatsApp membership
          or identity beyond email or phone-based sign-in.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Matches &amp; RSVPs</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Any approved group member may create a match unless we restrict that in the future. Player
          limits, standby promotion, and drop-out rules are enforced by the app but do not replace
          communication between players and hosts. You are expected to honour confirmed commitments
          or update your RSVP promptly.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">UPI prepayment</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          When a host enables prepayment, you pay the host directly through your UPI app.
          CricScheduler generates a payment intent and records status for coordination; we are not a
          bank, payment aggregator, or escrow service. Disputes over fees, refunds, or no-shows are
          between you and the host. Hosts must verify payments honestly before confirming spots.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Acceptable use</h2>
        <p className="text-sm leading-relaxed text-gray-600">You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
          <li>Use the Service for unlawful, harassing, or fraudulent purposes.</li>
          <li>Attempt to bypass security, scrape data, or overload our systems.</li>
          <li>Impersonate others or use phone numbers or email addresses you do not control.</li>
          <li>Reverse engineer, copy, or resell the Service or its software.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Intellectual property</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          CricScheduler, including its software, design, and branding, is proprietary and owned by
          Subhodeep B. These terms do not grant you any right to use our code or trademarks except
          as needed to use the Service. The software is not open source.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Disclaimer of warranties</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          To the fullest extent permitted by law, the Service is provided without warranties of any
          kind, whether express or implied, including fitness for a particular purpose, accuracy of
          match information, or uninterrupted availability.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Limitation of liability</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          To the fullest extent permitted by law, Subhodeep B and CricScheduler will not be liable
          for indirect, incidental, special, or consequential damages, or for lost profits, data, or
          goodwill, arising from your use of the Service — including missed matches, payment
          disputes, injuries at cricket games, or actions of other users or hosts. Our total
          liability for any claim related to the Service is limited to the amount you paid us for
          the Service in the twelve months before the claim (typically zero, as the Service is
          currently free to use).
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Termination</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          You may stop using the Service at any time. We may suspend or terminate access if you
          violate these terms or if we discontinue the Service. Hosts may remove you from a group;
          that affects only that group, not necessarily your entire account.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Governing law</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          These terms are governed by the laws of India. Courts in India shall have exclusive
          jurisdiction over disputes, subject to any mandatory consumer protections that apply where
          you live.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Changes</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We may update these terms. The &quot;Last updated&quot; date will change when we do.
          Continued use after changes means you accept the revised terms.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
        <p className="mt-2 text-sm text-gray-600">
          Questions about these terms: <ObfuscatedEmail />.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          See also our{" "}
          <Link href="/privacy" className="font-medium text-green-700 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

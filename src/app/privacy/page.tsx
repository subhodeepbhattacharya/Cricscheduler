import Link from "next/link";
import { ObfuscatedEmail } from "@/components/obfuscated-email";

export const metadata = {
  title: "Privacy Policy — CricScheduler",
  description: "How CricScheduler collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="pb-4">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: July 2026</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          CricScheduler (&quot;we&quot;, &quot;us&quot;) is operated by Subhodeep B. This policy
          explains what personal data we collect when you use the CricScheduler web app, why we
          collect it, and how we handle it. We do not sell your personal data.
        </p>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Information we collect</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
          <li>
            <span className="font-medium text-gray-800">Account data:</span> a display name and the
            phone number or email address you use to sign in (you may have both if you use both
            methods).
          </li>
          <li>
            <span className="font-medium text-gray-800">Group &amp; match data:</span> group names,
            descriptions, optional WhatsApp links, match details (date, time, venue, fees), and
            your RSVPs (confirmed, standby, declined, dropped out).
          </li>
          <li>
            <span className="font-medium text-gray-800">Team assignments:</span> if a host assigns
            sides for a match, your name appears in the lineup visible to other group members.
          </li>
          <li>
            <span className="font-medium text-gray-800">Payment records:</span> when a match uses
            optional UPI prepayment, we store payment metadata such as amount, status, and a
            transaction reference. Payments are made in your UPI app; we do not collect or store bank
            account, card, or UPI PIN details.
          </li>
          <li>
            <span className="font-medium text-gray-800">Technical data:</span> session cookies and
            similar tokens needed to keep you signed in, plus standard server logs (e.g. IP address,
            browser type) from our hosting provider.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">How we use your information</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
          <li>Authenticate you via one-time codes sent to your email or on WhatsApp.</li>
          <li>Run groups, matches, RSVPs, standby lists, and optional team lineups.</li>
          <li>Let hosts verify UPI prepayments and manage participants.</li>
          <li>Protect the service (e.g. reCAPTCHA on OTP requests to reduce abuse).</li>
          <li>Respond to support or legal requests you send us.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Who can see your data</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Other members of a cricket group can see information needed to coordinate — for example
          your name, phone number when available (on join requests and member lists for hosts), and
          match participation status. We do not make your profile public on the open internet.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Service providers</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We use trusted third parties to operate the app. They process data on our behalf only as
          needed to provide the service:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
          <li>
            <span className="font-medium text-gray-800">Supabase</span> — authentication, database,
            session storage, and delivery of email sign-in codes.
          </li>
          <li>
            <span className="font-medium text-gray-800">MSG91</span> — delivery of WhatsApp
            one-time codes for sign-in.
          </li>
          <li>
            <span className="font-medium text-gray-800">Google reCAPTCHA</span> — fraud prevention
            on OTP requests (subject to Google&apos;s privacy policy).
          </li>
          <li>
            <span className="font-medium text-gray-800">Vercel</span> — hosting and delivery of the
            web application.
          </li>
          <li>
            <span className="font-medium text-gray-800">Google Maps</span> — only if you or a host
            uses map links or location features; Google may process data per its own policies.
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-gray-600">
          UPI payments go directly between you and the match host in your UPI app. CricScheduler is
          not a payment gateway and does not hold your money.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We use essential cookies (or equivalent browser storage) to maintain your signed-in
          session. We do not use advertising or cross-site tracking cookies.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Retention &amp; deletion</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We keep your data while your account is active and as needed to run groups and matches you
          belong to. You may ask us to delete your account or correct inaccurate information by
          emailing us. Some records may be retained where required by law or for legitimate
          operational needs (e.g. resolving payment disputes between you and a host).
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Your rights</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Depending on where you live (including under India&apos;s digital privacy laws), you may
          have rights to access, correct, delete, or restrict certain processing of your personal
          data. Contact us to exercise these rights and we will respond within a reasonable time.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Children</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          CricScheduler is intended for amateur adult cricket groups. It is not directed at children
          under 13, and we do not knowingly collect data from children.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Changes</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          We may update this policy from time to time. The &quot;Last updated&quot; date at the top
          will change when we do. Continued use of the app after changes means you accept the
          updated policy.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
        <p className="mt-2 text-sm text-gray-600">
          Privacy questions or requests: <ObfuscatedEmail />.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          See also our{" "}
          <Link href="/terms" className="font-medium text-green-700 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

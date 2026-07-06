# Changelog

All notable changes to this project are recorded here, newest first.
Timestamps are in IST (UTC+5:30).

## 2026-07-06 — Shared auth cookies for www/apex; cricket favicon
- Auth session cookies on `cricscheduler.com` and `www.cricscheduler.com` now use `Domain=.cricscheduler.com` so sign-in on one host is recognized on the other (`src/lib/auth-cookies.ts`, wired through Supabase browser/server/middleware clients).
- Added `src/app/icon.svg` (cricket bat and ball on green) as the browser tab favicon, matching the homepage emoji branding.
- Updated ARCHITECTURE.md deploy checklist for apex + www redirect URLs.

## 2026-07-06 — Per-match host UPI ID (remove global VPA env var)
- UPI prepayment now uses the **host's UPI ID** set on each match (`host_upi_vpa` column, migration `022_match_host_upi_vpa.sql`) instead of a global `NEXT_PUBLIC_UPI_MERCHANT_VPA`. The match form shows a required "Your UPI ID" field when prepayment is enabled; `buildUpiIntentUrl` uses that VPA for `upi://pay` links.
- Removed `NEXT_PUBLIC_UPI_MERCHANT_VPA` from env docs; payments go directly to the match host.

## 2026-07-06 — Clarify auth rate limits (phone/WhatsApp is limited too)
- Added a **Rate limits** section to ARCHITECTURE.md correcting a common misconception: **both** email and phone/WhatsApp sign-in are rate-limited by Supabase. Email (built-in sender) is hard-locked at **2/hour** until custom SMTP; phone/WhatsApp OTP goes through `/auth/v1/otp` first (**30 OTPs/hour project-wide + 60s per-user cooldown**, both adjustable in Auth → Rate Limits without SMTP). Noted the OTP bucket is shared across email+phone and that MSG91 has its own WhatsApp quotas.
- Reworded the email testing note to say the built-in sender is fixed at 2/hour (not "a few/hour") and link to the new section.

## 2026-07-06 — Update contact email to oneeightai@gmail.com
- Changed the public contact address to **oneeightai@gmail.com** in the bot-protected `ObfuscatedEmail` component (used by About/Privacy/Terms) — still rendered as `oneeightai [at] gmail [dot] com` with no literal `@` in the DOM and the `mailto:` assembled only in JS on click.
- Updated the licensing-inquiries contact in `LICENSE` (and the proprietary-license rule template) to match.

## 2026-07-06 — Prefer WhatsApp sign-in; de-emphasize email
- The sign-in form now **defaults to phone (WhatsApp)** instead of email.
- Replaced the equal Email/Phone toggle with a quieter text link: email is now a "No WhatsApp? Sign in with email instead" fallback (and a matching link back to WhatsApp when on email). No change to the underlying OTP flows.

## 2026-07-06 — Sync ARCHITECTURE.md with current auth
- Updated ARCHITECTURE.md to reflect the live auth model: **email OTP + WhatsApp OTP in all environments** (`{ email: true, phone: "whatsapp" }`), SMS removed as a user-facing option (`PhoneMode = false | "whatsapp"`), and `sendOtp` always requesting Supabase's `sms` channel to fire the hook. Refreshed the tech-stack row, sign-in methods, testing notes, and deployment checklist items 5–6.

## 2026-07-06 — Align About/Privacy/Terms with current auth
- Updated the About, Privacy, and Terms pages to reflect **email + WhatsApp** sign-in (SMS removed as a user-facing option): reworded auth copy, noted phone numbers may be absent for email-only accounts, and listed Supabase as the sender of email sign-in codes (MSG91 for WhatsApp).
- Bumped the Terms "Last updated" date to July 2026.

## 2026-07-06 — WhatsApp OTP live (email + WhatsApp in all environments)
- Enabled **WhatsApp OTP in production** alongside email (`{ email: true, phone: "whatsapp" }` in `src/app/auth/page.tsx`) now that Meta Business verification and the MSG91 authentication template are live.
- `sendOtp` now always requests Supabase's `sms` channel (every environment) so the MSG91 Send SMS Hook fires consistently; the `whatsapp` channel would bypass the hook. Delivery is still WhatsApp via MSG91.
- Hardened the `sms-hook` Edge Function: downstream MSG91 failures return HTTP 500 (not MSG91's status) so a provider error no longer surfaces as the misleading "Hook requires authorization token" in Supabase Auth; the real MSG91 status is kept in the log message.

## 2026-07-04 — Email OTP sign-up and sign-in
- Added **email one-time-code** auth alongside phone: `sendEmailOtp` / `verifyEmailOtp` use Supabase's native `signInWithOtp({ email })` + `verifyOtp({ type: "email" })`, reusing the existing "enter your code" screen.
- The sign-in form now has an **Email / Phone** toggle when both are enabled. Methods are environment-driven: **production is email-only** (WhatsApp hidden until Meta Business verification / MSG91 are live); development shows Email + Phone (SMS/WhatsApp) for testing.
- No schema migration needed — `users.email`/`users.phone` are already nullable and the signup trigger handles email-only accounts.
- Note: email delivery uses Supabase's built-in sender (rate-limited, testing only); configure custom SMTP before real use. Email and phone remain separate accounts (no identity linking yet).

## 2026-07-02 — WhatsApp OTP delivery via MSG91 (Send SMS Hook)
- Phone OTP is now delivered over **WhatsApp** using MSG91 via a Supabase **Send SMS Hook** Edge Function (`supabase/functions/sms-hook/`). Supabase still generates/validates the code and manages sessions (no custom auth), and WhatsApp avoids Indian DLT/SMS registration.
- Production sign-in is **WhatsApp-only** (single button); development keeps both **SMS** and **WhatsApp** buttons via the new `channelMode` prop. In production the server requests Supabase's `sms` channel so the hook fires; the hook delivers via WhatsApp.
- Added `supabase/config.toml` (`verify_jwt = false` for the hook) and documented MSG91 secrets in `.env.example` (`MSG91_AUTHKEY`, `MSG91_WA_INTEGRATED_NUMBER`, `MSG91_WA_TEMPLATE_NAME`, …).
- Updated `ARCHITECTURE.md` (auth flow + diagram, OTP/testing/deploy sections, migrations `001–021`) and the Privacy page (provider **Twilio → MSG91**).

## 2026-06-29 — Privacy, Terms, About refresh, prominent match times
- Added `/privacy` and `/terms` tailored to phone OTP, Supabase, optional UPI, and no data selling; footer links **About · Privacy · Terms**.
- Updated `/about` for current features (member match creation, standby/teams, join-request phone, etc.) and aligned sign-in CTA with the homepage.
- Upcoming match cards show **start time** prominently in green above the match title.

## 2026-06-29 — Team assignment, member match creation, group UX
- Hosts/co-hosts can optionally assign confirmed players to **Team A / Team B** with custom names on manage match (`019_match_teams.sql`, `020_match_team_names.sql`); read-only lineup on the match page for all members.
- Any **active group member** can create matches (`021_member_create_match.sql`); host-only tools unchanged.
- **Past matches** section is collapsible and collapsed by default; upcoming date headers show match count in green.
- **Mark dropped out** on manage participants requires confirmation.

## 2026-06-27 — Fix standby auto-promotion on drop out
- Player-initiated drop out now promotes the earliest standby player to confirmed via a database RPC (`018_promote_standby_rpc.sql`). Previously RLS only allowed hosts to update another member's participation, so self-service drop out never promoted standby.

## 2026-06-27 — Dropped-out players can rejoin open matches
- Players who dropped out see **Rejoin match** (or **Rejoin as standby** if full) while the match start time has not passed; same capacity rules apply as a first-time RSVP.
- Prepayment matches: if the host already verified a prior payment, rejoin uses that payment instead of paying again.

## 2026-06-27 — Confirm before dropping out of a match
- **Drop out** on the match page now shows an inline confirmation step (Cancel / Yes, drop out) so players can't leave by accident.

## 2026-06-27 — Show signed-in user name in header
- Header shows `Welcome, {name}` under the nav when signed in (name from profile or sign-up).

## 2026-06-27 — Group members list; remove (hosts)
- Hosts/co-hosts see a collapsible **Members** section on the group page (collapsed by default).
- **Remove** (with confirmation warning) sets status `LEFT`; can re-request via invite. Ban removed.
- Migration `017_group_members.sql`: `get_group_members`, `remove_group_member` RPCs.

## 2026-06-26 — Show phone on join requests
- Migration `016_pending_requests_phone.sql`: backfills `users.phone` from auth, and `get_pending_join_requests` falls back to `auth.users.phone` when the profile phone is missing.
- `ensureUserProfile` now syncs phone onto existing profiles; join-request UI formats phone and shows a fallback if still unavailable.
- After approve/deny, hosts can optionally open a WhatsApp deep link with a pre-filled message to notify the player.

## 2026-06-26 — Homepage sign-in CTA
- Replaced "Get started" with **Sign in**; added **Or sign up instead** link to `/auth?mode=signup`.
- Auth page reads `?mode=signup` to open the sign-up form by default.

## 2026-06-26 — About page + site footer
- Added `/about` with product overview, how-it-works, phone sign-in, and WhatsApp/group notes.
- Site footer on all pages with an About link and copyright line.
- Contact email on About is obfuscated (`[at]` / `[dot]`, no `mailto:` in HTML); click still opens the mail client.

## 2026-06-26 — Edit group (hosts/co-hosts)
- Hosts and co-hosts can edit a group at `/groups/[groupId]/edit`: update name, description, and WhatsApp group link (optional) after creation.
- Shared `GroupForm` for create and edit; create form label now says "WhatsApp group link (optional)".

## 2026-06-26 09:28 IST — Upcoming matches grouped by date
- Upcoming matches on the group page are now grouped by date/day; tap a date header to expand and see all matches scheduled that day (nearest date expanded by default).

## 2026-06-26 09:23 IST — Inline confirmation for deleting a match
- Replaced the native `window.confirm` on the delete-match button with an inline "Yes, delete / Cancel" confirmation (matches the delete-group pattern), so hosts can't delete a match in a single click.

## 2026-06-26 09:14 IST — Past matches section; block joining elapsed matches
- Group page now splits matches into **Upcoming** (scheduled, not yet started) and **Past matches** (elapsed/cancelled), comparing the match start instant in IST so it's correct regardless of server timezone.
- Elapsed matches can no longer be joined: the RSVP panel shows "This match has ended" instead of action buttons, and `confirmSpot`/`initiatePayment` reject elapsed matches server-side.
- Added `isMatchElapsed` / `getMatchStartMs` helpers in `lib/utils.ts`.

## 2026-06-26 09:07 IST — UPI prepayment uses a total amount split per player
- When "Require UPI prepayment" is on, the host now enters a **Total amount (₹)**; the form derives **fee per player = total ÷ max players** (rounded **up** to the nearest paisa so the full total is always covered) and shows it live, including the collected total when it exceeds the entered amount. The derived per-player fee is what's stored/charged.
- Requires total > ₹0 and ≥ 2 players; server-side fee check in `createMatch`/`updateMatch` remains as a backstop. When prepayment is off, the optional flat "Fee per player" field is unchanged.

## 2026-06-26 08:58 IST — Separate sign-in / sign-up modes
- Auth form now has a **Sign in / Sign up** toggle. Sign up asks for name + phone (name required); sign in asks only for phone — returning users no longer re-enter their name.
- Name is only sent to the OTP request in sign-up mode; neutralized the auth page subtitle.

## 2026-06-26 08:34 IST — SMS-default auth + local OTP testing docs
- Auth form now shows both **SMS** (primary/default) and **WhatsApp** buttons; SMS-first is less error-prone on a Twilio trial (avoids the WhatsApp channel-mismatch error 21910).
- Added a "Testing phone OTP locally" section to `ARCHITECTURE.md`: Supabase test phone numbers (no Twilio), plus SMS/WhatsApp sender setup for real delivery.

## 2026-06-26 07:48 IST — Proprietary license
- Added a proprietary, all-rights-reserved `LICENSE` (replaces the previous MIT reference, which would have granted reuse rights).
- README now states "Proprietary — All rights reserved" and links to `LICENSE`; `package.json` marked `"license": "UNLICENSED"`.

## 2026-06-26 07:37 IST — Document deployment
- Added a Deployment section to `ARCHITECTURE.md`: Vercel + Supabase recommendation, required env vars table, and a post-deploy checklist (Supabase Auth URLs, migrations, reCAPTCHA/Maps domain restrictions, Twilio Verify).

## 2026-06-26 07:35 IST — Remove reCAPTCHA from group creation
- Dropped the reCAPTCHA check on `createGroup` (server action + create-group form): once a user is OTP-verified, bot-created groups are already gated by phone verification, making it redundant.
- reCAPTCHA remains on the `send_otp` flow, where it still protects against SMS pumping / OTP bombing (Twilio spend).

## 2026-06-25 19:17 IST — Fix phone signup trigger ("Database error saving new user")
- Migration `015_phone_signup_trigger.sql`: rewrote `handle_new_user()` to support phone signups (defaults name to "Player", allows null email, stores phone with a leading "+"); re-asserts email-nullable + unique phone index so it works even without `014`.
- Added server-side logging of the exact Supabase error in `sendOtp` to aid provider debugging.

## 2026-06-25 18:34 IST — Switch to phone OTP auth (WhatsApp/SMS)
- Replaced email/password auth with phone OTP: `sendOtp` (WhatsApp default, SMS fallback) and `verifyPhoneOtp` via Supabase + Twilio Verify.
- New two-step auth UI (name + phone → 6-digit code, with resend/change-number); signup and sign-in are unified.
- Added `lib/phone.ts` for E.164 normalization (defaults to +91).
- Migration `014_phone_auth.sql`: made `users.email` nullable, added a unique `users.phone` index, and updated the pending-requests RPC to return phone.
- `ensureUserProfile` now keys off phone; participant and pending-request lists display phone instead of email.
- Removed email-only pieces (email validation, `/auth/confirm`, forgot-password/reset-password) and updated `ARCHITECTURE.md`.
- Requires Supabase Phone provider + Twilio Verify (with a WhatsApp sender) to be configured to send real codes.

## 2026-06-25 18:12 IST — Fix hydration error from Link-wrapped buttons
- Added a `buttonVariants()` helper to the Button component and applied it to `<Link>` elements instead of nesting a `<button>` inside an `<a>`.
- Removed the invalid `<a><button>` nesting (a React 19 hydration error, e.g. on the homepage "Get started" button) across the homepage, groups list, group detail, and match detail pages.

## 2026-06-20 22:33 IST — Forgot password flow
- Added a "Forgot password?" entry to the sign-in form that switches to a reset-request view.
- Added the `requestPasswordReset` action (reCAPTCHA-gated, anti-enumeration generic response) that emails a reset link via `resetPasswordForEmail`, routed through `/auth/confirm` → `/auth/reset-password`.
- Added the `/auth/reset-password` page (recovery-session guarded) and form, plus the `updatePassword` action to set a new password.

## 2026-06-20 22:26 IST — Email validation on signup
- Added `src/lib/email-validation.ts`: format check, reserved/placeholder domain blocklist, disposable-provider blocklist, and a best-effort DNS MX deliverability check (fails open on transient DNS errors).
- Enforced the above in the `signUp` action and normalized the email (trim + lowercase).
- Set `emailRedirectTo` on signup and added the `/auth/confirm` route handler to complete the email verification link via `verifyOtp`, then redirect into the app.
- Signup no longer enters the app while confirmation is pending; shows a "check your email" message instead.
- Surfaced expired/invalid confirmation links as an error on `/auth`.
- Introduced this `CHANGELOG.md` and an always-on Cursor rule to keep it updated on every commit + push.

## 2026-06-20 22:13 IST — Tighten match access
- Dropped the permissive "Anyone authenticated can read matches for RSVP" RLS policy (migration `013_tighten_match_access.sql`) that allowed any logged-in user to read every match across groups.
- Replaced the RSVP auto-join with an `isActiveMember` check so RSVP requires an existing ACTIVE membership, enforcing the invite + host-approval flow.

## 2026-06-20 22:05 IST — reCAPTCHA v3 and mobile UX
- Gated signup and group creation behind Google reCAPTCHA v3 with server-side score verification (skipped when keys are unset for local dev).
- Forced 16px form inputs on mobile to stop iOS auto-zoom; bumped small button tap targets to a 44px minimum height.

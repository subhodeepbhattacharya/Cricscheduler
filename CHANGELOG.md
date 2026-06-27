# Changelog

All notable changes to this project are recorded here, newest first.
Timestamps are in IST (UTC+5:30).

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

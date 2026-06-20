# Changelog

All notable changes to this project are recorded here, newest first.
Timestamps are in IST (UTC+5:30).

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

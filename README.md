# CricScheduler

A mobile-first web app to manage amateur cricket matches for WhatsApp groups. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Groups** — Create cricket groups and invite your WhatsApp crew
- **Matches** — Schedule matches with date, time, location, and player limits
- **RSVP** — Players confirm, join standby, or decline
- **UPI payments** — Optional prepayment via UPI deep-link (host verifies manually)
- **Host tools** — Manage participants, verify payments, promote standby players

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL)

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In **Project Settings → API**, copy your project URL and anon key

### 2. Run the database migration

In the Supabase SQL Editor, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, and the auto-profile trigger.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_UPI_MERCHANT_VPA=yourname@upi
NEXT_PUBLIC_APP_NAME=CricScheduler
```

**Google Maps setup:** In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis), enable **Maps JavaScript API** and **Places API**, create an API key, and restrict it to your domain (or `localhost` for dev).

### 4. Install and run

```bash
nvm use          # uses Node LTS from .nvmrc
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Disable email confirmation (optional, for local dev)

In Supabase Dashboard → **Authentication → Providers → Email**, disable "Confirm email" for faster local testing.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Sign in / sign up |
| `/groups` | List your groups |
| `/groups/new` | Create a group |
| `/groups/[groupId]` | Group detail + upcoming matches |
| `/groups/[groupId]/matches/new` | Create a match (host only) |
| `/matches/[matchId]` | Match detail + RSVP |
| `/matches/[matchId]/manage` | Manage participants (host only) |

## UPI payment flow (MVP)

1. Player clicks **Pay & Confirm Spot**
2. App generates a UPI intent URL and saves a `PENDING` payment record
3. Browser redirects to UPI app on mobile
4. Host verifies payment in their UPI app
5. Host marks payment as SUCCESS/FAILED in the manage page
6. On SUCCESS, player's participation is confirmed

## Data model

- **users** — Profile linked to Supabase Auth
- **cricket_groups** — Cricket groups (named `cricket_groups` in DB to avoid SQL reserved-word issues)
- **group_memberships** — User roles (HOST, CO_HOST, PLAYER)
- **matches** — Scheduled matches
- **match_participations** — RSVP status per user per match
- **payments** — UPI payment records

## License

MIT

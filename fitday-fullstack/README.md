# FITDAY — full-stack starter

FITDAY is a digital wardrobe and daily outfit planner. This repository is the full-stack foundation for the web app, with a later mobile client in mind.

## Stack

- **Frontend:** React 19 + Next.js 16 App Router + TypeScript
- **Backend:** Node.js runtime through Next.js Route Handlers (`src/app/api/**`)
- **Database:** Supabase Postgres
- **Authentication:** Supabase Auth, cookie-based SSR sessions via `@supabase/ssr`
- **Image storage:** private Supabase Storage bucket (`wardrobe`)
- **AI:** Vercel AI SDK 6 + Vercel AI Gateway (optional; deterministic fallback works without credentials)
- **Validation:** Zod
- **3D preview:** Three.js + React Three Fiber + Drei
- **Styling:** Tailwind CSS v4 import plus a small custom design system in `globals.css`

## What is included

- Light/minimal responsive application shell.
- Dashboard with wardrobe counters and today's outfit area.
- Wardrobe: create garments, upload private photos, search/filter, update laundry state and delete.
- Garment metadata: category, brand, colour, optional HEX swatch, fit, laundry status, image path and notes.
- Outfit generation API that uses **only clean garments** and saves the daily combination.
- Outfit diary page and 3D mannequin preview with orbit controls and colour changes.
- Email/password sign-in and sign-up.
- Supabase SQL migration with tables, indexes, profile bootstrap trigger, Row Level Security and private image bucket policies.
- API validation and ownership checks.

The current outfit generator uses an optional AI ranking layer through AI SDK 6 / AI Gateway when `AI_GATEWAY_API_KEY` and `AI_MODEL` are configured; otherwise it falls back to a deterministic baseline. The current avatar is a procedural 3D mannequin, not a realistic body scan or a cloth simulation. A proper avatar will require a rigged GLB/glTF model and a garment fitting pipeline.

## Requirements

- Node.js 20.9 or newer (Node 22 LTS recommended)
- npm 10+ or pnpm
- A Supabase project

## 1. Install dependencies

```bash
npm install
```

## 2. Configure Supabase

Create a Supabase project. In **Project Settings → API**, copy the project URL and publishable key.

```bash
cp .env.example .env.local
```

Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Do not put a Supabase `service_role` key or any secret in a `NEXT_PUBLIC_` variable. This project uses the user's authenticated session and RLS for normal application operations.

## 3. Create the database and storage bucket

Run `supabase/migrations/20261116000100_initial_schema.sql` in the Supabase SQL Editor, or use the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migration creates:

- `profiles`
- `garments`
- `avatar_profiles`
- `outfits`
- `outfit_items`
- enums for category, fit and laundry status
- RLS policies on all user data tables
- a private `wardrobe` Storage bucket with per-user folder policies
- a trigger that creates a profile and avatar profile when a new auth user registers

For local email/password testing, configure Supabase Auth email confirmation to match your desired development flow. In production, configure your SMTP provider and allowed redirect URLs.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

Create an account via **Sign in → Create an account**. If email confirmation is enabled, confirm the address before signing in.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/garments` | List the signed-in user's garments; returns short-lived signed photo URLs |
| POST | `/api/garments` | Create a garment after Zod validation |
| PATCH | `/api/garments/:id` | Update garment metadata or laundry status |
| DELETE | `/api/garments/:id` | Delete a garment |
| GET | `/api/outfits/today?date=YYYY-MM-DD` | Read the saved daily outfit |
| GET | `/api/avatar` | Read the signed-in user avatar profile |
| PATCH | `/api/avatar` | Save avatar model reference and JSON configuration |
| POST | `/api/outfits/generate` | Generate and save today's combination |

All routes execute on the Node.js runtime, verify Supabase JWT claims and rely on database RLS as a second security boundary.

## Data model

- **profiles**: display name and styling preferences.
- **garments**: the user's clothing inventory, laundry state and image path.
- **avatar_profiles**: avatar model reference and JSON configuration.
- **outfits**: one daily outfit per user/date.
- **outfit_items**: garments included in each outfit, with display position.

## Environment variables

| Variable | Required | Where used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser and server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser and server Supabase clients |
| `AI_GATEWAY_API_KEY` | Future | Server-side AI outfit explanation / vision metadata |
| `AI_MODEL` | Future | Server-side model selection |
| `WEATHER_API_KEY` | Future | Weather-aware styling |

## Recommended next milestones

1. Finish auth onboarding and profile preferences (size, height range, style tags, climate/location consent).
2. Replace rule-only recommendations with a hybrid outfit ranking engine: hard constraints first (laundry, category, season), then personal preferences and colour compatibility, then LLM explanation.
3. Add image-assisted garment metadata extraction with user confirmation.
4. Add a rigged, configurable GLB avatar and real garment assets with body measurements / size mapping. Avoid claiming photorealistic try-on until cloth fitting is validated.
5. Add weather context and outfit feedback (like/dislike, worn/not worn).
6. Add scheduled outfit preparation and a responsive installable PWA.
7. Build a mobile client (Expo / React Native) against the same API and Supabase data model.

## Security notes

- Never expose a Supabase service-role key to the browser.
- Keep the `wardrobe` Storage bucket private; images are served with short-lived signed URLs.
- The SQL migration scopes user data using `auth.uid()` policies.
- Do not store body photos or measurements until consent, retention and deletion flows are implemented.
- Before production launch, add rate limits, audit logging, upload content scanning, error monitoring, backups and automated tests.

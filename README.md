# nightcap

A shared house for a group of friends, always at night.

Everyone in a house gets a room in one building, and from the street you can
see whose lights are on. Come home, look up at the windows, leave something
for whoever's around. Houses come in four cities — Paris, New York, Venice and
Tokyo — and everything on screen is drawn in code, with no image assets.

## Features

- **Houses.** Sign up, make a house, share a 7-day invite link, and everyone
  claims a window. Each account can belong to up to five houses, and a house
  holds up to twelve people.
- **Presence.** A window is lit while its owner has the house open. The page
  checks in every minute while visible, and the light stays on for three
  minutes after the last check-in. The database stamps the time, so nobody
  can be marked home on someone else's behalf.
- **Rooms.** Twelve distinct room layouts per house — an attic library, a low
  wide den, and so on — each with its own window, desk, shelving, floor and
  plants. Owners can change the bed, nightstand, paint, curtains, posters,
  lamps, rug, desk, extra furniture and pet. Anyone in the house can visit;
  only the owner can edit.
- **The view outside.** The street through someone's window shows their sky:
  their local time of day and their actual weather (via open-meteo, at the
  town they've pinned on their map).
- **Notes.** Leave a note in someone's room and it's slipped under their door.
  Unread notes lie folded on the floor until opened.
- **Living room.** A shared lounge, different for every city and every house,
  with a seat for each person that lights up while they're in.
- **Spotify (optional).** A record player on the wall that spins while you're
  listening, with the current track shown on your window's card.
- **Demo and dev modes.** `/demo` is a street of made-up residents that needs
  no backend. `/dev` lets you explore every city and room locally.

## Tech stack

| Area      | Choice                                                      |
| --------- | ----------------------------------------------------------- |
| Web app   | Next.js (App Router), React, TypeScript                     |
| Rendering | PixiJS with custom WebGL filters                            |
| Backend   | Supabase (Postgres, Auth, Realtime) with row level security |
| Tests     | Vitest (unit), plain SQL against Postgres (database)        |
| Tooling   | pnpm workspaces, ESLint, Prettier, GitHub Actions           |

## Getting started

Requires Node 22+ and pnpm.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. The demo street at `/demo` and the sandbox at
`/dev` work without any further setup.

### Scripts

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                |
| `pnpm build`     | Production build                                    |
| `pnpm test`      | Unit tests for every package                        |
| `pnpm typecheck` | TypeScript across the workspace                     |
| `pnpm lint`      | ESLint                                              |
| `pnpm format`    | Prettier                                            |
| `pnpm test:db`   | Run all migrations and the policy tests on Postgres |

## Configuration

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill it in:

| Variable                               | Required | Notes                                             |
| -------------------------------------- | -------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes      | Project URL                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes      | Publishable key (safe in the browser)             |
| `SPOTIFY_CLIENT_ID`                    | no       | Enables the record player                         |
| `SPOTIFY_CLIENT_SECRET`                | no       | Server only; never expose with `NEXT_PUBLIC_`     |
| `NEXT_PUBLIC_DEV_MODE`                 | no       | Set to `1` to keep `/dev` on in production builds |

### Supabase

1. Apply the migrations in `supabase/migrations/` in order, either with the
   Supabase CLI (`supabase db push`) or in the SQL editor.
2. **Authentication → Providers → Email:** enable email confirmation, a
   minimum password length of 8, and leaked password protection.
3. **Authentication → URL Configuration:** add `<your-origin>/login` to the
   redirect URLs.
4. **Realtime → Settings:** disable public access. House updates are sent on
   private, members-only channels.

### Spotify

Create an app at developer.spotify.com and add
`<your-origin>/api/spotify/callback` as a redirect URI. Spotify does not
accept `localhost`, so use `http://127.0.0.1:3000` in development (and add
`http://127.0.0.1:3000/login` to the Supabase redirect URLs). Apps in
Spotify's development mode only work for users added under "Users and
Access".

## Routes

| Route              | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `/`, `/login`      | Sign in                                       |
| `/signup`          | Create an account (username, email, password) |
| `/keys`            | Your houses                                   |
| `/new`             | Make a house and choose its city              |
| `/h/<id>/invite`   | Get an invite link                            |
| `/join/<code>`     | Preview a house and join it                   |
| `/h/<id>`          | The street: claim a window or visit a lit one |
| `/h/<id>/room/<n>` | A room; `/h/<id>/room` goes to your own       |
| `/h/<id>/lounge`   | The living room                               |
| `/demo`, `/dev`    | Demo street and local sandbox                 |

## Project structure

```
apps/web          Next.js app: routes, UI overlays, Supabase and Spotify integration
packages/scene    Framework-free renderer for the street, rooms and lounge (PixiJS)
supabase          SQL migrations and database tests
```

### The scene package

`StreetScene.create(el, { rooms, marquee })` mounts the street, `setRooms()`
updates it, and it emits `window:hover` / `window:click` events with
screen-space bounds so HTML can be layered over the canvas. Everything is
seeded, so a given house looks the same on every load.

- **Rooms** use one-point perspective (`room/projection.ts`): furniture is
  modelled as boxes projected into the scene, and smaller items are drawn
  flat. `room/plan.ts` places everything so nothing overlaps, and
  `readLayout` validates saved layouts, filling gaps and correcting
  impossible arrangements.
- **Shaders.** `PaperFilter` adds paper grain, uneven ink and a vignette over
  the whole frame. `WetFilter` turns a flipped render of the street into a
  puddle reflection, smearing lights downward like wet asphalt.
- **Hit testing.** The reflection re-renders the upper half of the world into
  a low-resolution texture every other frame, which disturbs Pixi's cached
  transforms, so windows are hit-tested manually in world space (`scene.ts`).
- **Performance.** When frames slow down, the scene drops bloom and refreshes
  the reflection less often rather than stuttering. Static parts of a room
  are cached as a single texture.
- **Accessibility.** `prefers-reduced-motion` turns off flicker and sway and
  thins the rain. The street also exposes a screen-reader list of windows.

## Security

Privacy is enforced in the database with row level security, not in the UI:
only residents can read a house, its rooms and its people. Creating, joining
and claiming go through `create_house`, `join_house` and `claim_room`, which
enforce the limits. Map pins are rounded to roughly 10 km by a trigger,
layouts have a size cap, and houses can't be edited once created.

`supabase/tests/policies.sql` signs in as several test users and verifies
these rules: outsiders see nothing, nobody can change another person's room,
the house and member limits hold, and signed-out users can't call protected
functions. CI runs it against Postgres on every push:

```sh
PGHOST=localhost PGUSER=postgres pnpm test:db
```

## Fonts

Display type is **Kollektiiv Collective** (UVA Type Foundry), paired with
**Rye** under one family name via `unicode-range` so Rye covers the characters
Kollektiiv lacks. Body text is **Cap Sizun**, with **Livonia** as a fallback.
See `apps/web/app/globals.css`. Only web font files are committed.

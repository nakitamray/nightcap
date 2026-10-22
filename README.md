# nightcap

A house for my friends, always at night.

Everyone gets a room in one building, and from the street you can see whose
lights are on. You come home, look up at the windows, leave something for
whoever's around. It's a Paris side street after the rain: lamplight, a café
still open, the moon over the rooftops.

You sign up, make a house (Paris, New York, Venice or Tokyo), send the link
round, and everyone picks a window. Double click your own window and you're
inside your room, which you can repaint and rearrange. Everything is drawn
in code, no image files.

## running it

```sh
pnpm install
pnpm dev
```

then open http://localhost:3000

```sh
pnpm test        # unit tests
pnpm typecheck
pnpm lint
pnpm build
```

## houses (supabase)

`/demo` is a street with made-up friends and works with no setup. Click any
window to look round that room and play with it; nothing you change there is
kept. Everything
else needs a Supabase project:

1. run each file in `supabase/migrations/`, oldest first, in the Supabase SQL editor
2. Authentication -> Sign In / Providers -> Email: keep "confirm email" on,
   minimum password length 8, require uppercase + symbols
3. Authentication -> URL Configuration: add `http://localhost:3000/login`
   (and your deployed url later) to the redirect urls
4. Realtime -> Settings: turn off "Allow public access", so only private
   channels work. The house channel is private and members only.
5. copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the
   project url + publishable key

How it fits together:

- `/` and `/login` sign in, `/signup` makes an account (username, email,
  password). Supabase emails a link to confirm, which lands back on `/login`.
- `/keys` is your keyring: up to five houses, each an arched window onto its
  city. Click one to go to that house's street.
- `/new` names a house and picks the city, then `/h/<id>/invite` hands you
  a 7-day `/join/<code>` link. Opening the link shows the house and asks
  first; moving in is a button, so no other site can join you up behind
  your back. A house needs two people; one that's still
  just you after a week gets swept away.
- `/h/<id>` is the street. Click an empty window to claim it (one room
  each), or a lit one to look round that person's room. "go to my room" and
  your curtains are up in the corner. A window is lit while that person has
  the house open: the page checks in every minute while it's on screen, and
  the light stays on for three minutes after the last check-in. The
  database stamps the time, so nobody can be home for someone else.
- `/h/<id>/room/<n>` is a room. Anyone in the house can look; only the person
  who lives there can change anything (the database agrees: you can only
  update your own membership). `/h/<id>/room` takes you to yours.
- All twelve rooms in a house are different
  (`packages/scene/src/room/variants.ts`): the attic library is tall and
  narrow, the den is low and wide, and each has its own window, desk,
  shelving, floor, plants and furniture. Click anything to change it: the
  bed (five frames, colours, which wall), the nightstand (a little chest, a
  skirted table or stacked suitcases), paint, window shape and curtains,
  posters for every free bit of wall, up to five extra pieces of furniture
  (slouchy chairs, beanbags, a mini sofa, poufs, a dresser, bookcases and so
  on), six old lamps, a rug, the desk, a cat or a dog, and an led strip in
  the rooms that don't have fairy lights. `plan.ts` works out where
  everything goes so nothing overlaps. The record
  on the wall connects Spotify and spins while you're listening; the map
  poster pins where you are (to the nearest town) next to everyone else.

### dev mode

`/dev` lets you try every city on your own, with no Supabase and no friends
needed: pick a city, then click into any of its twelve rooms and change
everything. Nothing is saved. It's on whenever you run
`pnpm dev`; set `NEXT_PUBLIC_DEV_MODE=1` to keep it on a deployed build.

Privacy is enforced in the database with row level security, not in the
ui: you can only read a house, its rooms and its people if you live there.
Map pins are rounded to about 10km by the database itself, layouts have a
size limit, and nobody can edit a house once it's made.
Creating, joining and claiming go through `create_house`, `join_house` and
`claim_room`, which hold the limits (5 houses, 12 people, one room each).

### database tests

`supabase/tests/policies.sql` signs in as a few made-up people and checks
the rules above actually hold: outsiders see nothing, you can't touch
someone else's room or curtains, room claiming, the five-house and
twelve-person limits, the sweep, pins, the live channel. `pnpm test:db` runs
every migration against a scratch Postgres (with a small stand-in for
Supabase's `auth` and `realtime` schemas) and then the tests. It needs a
Postgres to talk to, e.g. `PGHOST=localhost PGUSER=postgres pnpm test:db`.
CI runs it on every push.

### spotify (optional)

Make an app at developer.spotify.com, add
`http://127.0.0.1:3000/api/spotify/callback` as a redirect uri, and put
`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` in `.env.local`. Spotify won't
take `localhost`, so open the site at `127.0.0.1:3000` when testing it (and
add `http://127.0.0.1:3000/login` to the Supabase redirect urls too). While
the app is in development mode, add each friend's Spotify email under
"users and access".

## layout

```
apps/web          next.js app -- pages, overlay ui, fonts
packages/scene    the street and the rooms, pixi.js + a couple of custom shaders
```

The scene is framework-free. `StreetScene.create(el, { rooms, marquee })`
mounts it, `setRooms()` updates it, and it emits `window:hover` /
`window:click` with screen-space bounds so html can sit on top of the canvas.

Everything is seeded, so the street looks the same every time you load it.

The room (`packages/scene/src/room`) is drawn the same way as the street:
flat colour, ink lines, glows with bloom, the paper pass over the top. It's
one-point perspective (`projection.ts`: room coordinates in, screen points
out) with the furniture as boxes run through it and the small things drawn
flat. The street itself (`StreetWorld`) runs live behind the window glass, so
people walk past while you're in your room. Night is a multiply layer cut
away wherever a lamp, candle or the window throws light. The layout is saved as json on your membership and
always read back through `readLayout`, which fills gaps and fixes anything
impossible (the desk can't share a wall with the bed).

A few things worth knowing:

- **Shaders.** `PaperFilter` runs over the whole frame (paper grain, uneven
  ink, vignette). `WetFilter` turns a flipped render of the street into the
  puddle reflection, smearing lights downward the way wet asphalt does.
- **Reflection.** The reflection re-renders the upper half of the world into a
  low-res texture every other frame. That messes with pixi's cached transforms,
  so windows are hit-tested by hand in world space (see `scene.ts`).
- **Performance.** If frames get slow the scene drops the bloom and refreshes
  the reflection less often instead of stuttering. In a room, everything that
  doesn't move is cached as a picture, and the street outside is drawn into a
  window-sized texture every other frame. The city cards on `/keys` and
  `/dev` are still pictures drawn once by the real scene, not live streets.
- **Reduced motion.** `prefers-reduced-motion` turns off the flicker and
  sway and thins out the rain.

## fonts

Display type is **Kollektiiv Collective** by UVA Type Foundry. It only has
letters, digits and `! , . ?`, so it's registered together with **Rye** under
one family name, split by `unicode-range`, and Rye fills in the missing
characters (`: ' / - &` etc). See `apps/web/app/globals.css`. Body text is
Cap Sizun, with Livonia behind it for the few characters it lacks.

Only the web font file is in the repo. Check Kollektiiv's license allows web
embedding before this goes anywhere public.

## next

- notes under the door, gifts on the step
- weather and local time per window
- what everyone's listening to, from the street

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

`/demo` is a street with made-up friends and works with no setup. Everything
else needs a Supabase project:

1. run each file in `supabase/migrations/`, oldest first, in the Supabase SQL editor
2. Authentication -> Sign In / Providers -> Email: keep "confirm email" on,
   minimum password length 8, require uppercase + symbols
3. Authentication -> URL Configuration: add `http://localhost:3000/login`
   (and your deployed url later) to the redirect urls
4. copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the
   project url + publishable key

How it fits together:

- `/` and `/login` sign in, `/signup` makes an account (username, email,
  password). Supabase emails a link to confirm, which lands back on `/login`.
- `/keys` is your keyring: up to five houses, each shown as a window onto
  its city with who lives there.
- `/new` names a house and picks the city, then `/h/<id>/invite` hands you
  a 7-day `/join/<code>` link. A house needs two people; one that's still
  just you after a week gets swept away.
- `/h/<id>` is the street. Double click an empty window to claim it (one
  room each). Lights are live presence: a window is lit while that person
  has the house open.
- `/h/<id>/room` is your room. Click anything to change it: bed (colours,
  and which wall), paint, window shape and curtains, up to two pictures,
  six old lamps, a rug, the desk, a light strip round the ceiling. The rest
  (shelves, plants, candles, the cat, a neon sign for the city) comes with
  the room. The record
  on the wall connects Spotify and spins while you're listening; the map
  poster pins where you are (to the nearest town) next to everyone else.

### dev mode

`/dev` lets you try every city on your own, with no Supabase and no friends
needed: the demo street with two empty rooms, claim one, go inside, change
everything. It saves to your browser only. It's on whenever you run
`pnpm dev`; set `NEXT_PUBLIC_DEV_MODE=1` to keep it on a deployed build.

Privacy is enforced in the database with row level security, not in the
ui: you can only read a house, its rooms and its people if you live there.
Creating, joining and claiming go through `create_house`, `join_house` and
`claim_room`, which hold the limits (5 houses, 12 people, one room each).

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
  the reflection less often instead of stuttering.
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

- visiting a friend's room
- notes under the door, gifts on the step
- weather and local time per window
- what everyone's listening to, from the street

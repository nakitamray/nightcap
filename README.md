# nightcap

A house for my friends, always at night.

Everyone gets a room in one building, and from the street you can see whose
lights are on. You come home, look up at the windows, leave something for
whoever's around. It's a Paris side street after the rain: lamplight, a café
still open, the moon over the rooftops.

Right now it's just the street: the facade with twelve windows, the marquee,
rain, reflections, all drawn in code. Click a window to flip its light.

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

## layout

```
apps/web          next.js app -- page, overlay ui, fonts
packages/scene    the street itself, pixi.js + a couple of custom shaders
```

The scene is framework-free. `StreetScene.create(el, { rooms, marquee })`
mounts it, `setRooms()` updates it, and it emits `window:hover` /
`window:click` with screen-space bounds so html can sit on top of the canvas.

Everything is seeded, so the street looks the same every time you load it.

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
Libre Caslon.

Only the web font file is in the repo. Check Kollektiiv's license allows web
embedding before this goes anywhere public.

## next

- accounts + one house per group, invite links
- real presence driving the lights
- rooms you can step into and decorate
- notes under the door, gifts on the step
- spotify / weather / local time per window

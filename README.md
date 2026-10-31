# 3D Resume Town

An explorable first-person 3D resume built with **React Three Fiber**. Your
resume is a little low-poly town: each building is a section (About,
Education, Experience, Skills, Projects, Contact). Walk in, inspect the
furniture, and the details open as panels — all under a living sky with a
full day/night cycle and dynamic weather.

## Running it

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build
npm run lint      # eslint (passes clean)
```

To smoke-test in a headless browser (screenshots of every weather state):

```bash
npm run dev -- --port 5183 --strictPort   # in one terminal
npm run verify                             # in another
```

## Controls

| Input | Action |
| --- | --- |
| `W A S D` / arrows | walk |
| `Shift` | sprint |
| `Space` | jump |
| Mouse | look around |
| `E` / `Enter` | enter buildings, inspect furniture, exit |
| `1` `2` `3` `4` | force clear / rain / storm / snow |
| `0` | let the weather drift on its own again |
| `T` | fast-forward time (60×) |
| `M` | mute / unmute ambient audio |
| `Esc` | open the résumé menu |

Visitors can also read every chapter directly from the entry/pause menu,
without using first-person controls. This keeps the portfolio usable with a
keyboard, on small screens, and when pointer lock is unavailable.

## The living world

- **Day/night cycle** — a full in-game day lasts 10 minutes. The sun and moon
  ride the sky, the gradient dome repaints itself continuously, stars and
  fireflies come out at night, street lamps and building windows switch on at
  dusk.
- **Weather** — clear, rain, storm and snow, drifting automatically or forced
  with the number keys. Weather is *remembered by the world*: rain slicks the
  ground and leaves reflective puddles (and a rainbow once it clears), snow
  accumulates into a white blanket and melts later, wind bends the trees,
  shears the chimney smoke and pushes the clouds.
- **Storms** — lightning bolts strike beyond the mountains with a sky flash
  and delayed, distance-scaled thunder.
- **Procedural audio** — wind, rain, thunder and footsteps are synthesized
  with the Web Audio API (zero audio files). Sound muffles when you step
  indoors.
- **Performance** — the forest is two GPU-instanced draw calls with wind sway
  done in the vertex shader; rain and snow are single static draw calls
  animated entirely on the GPU. Procedural clouds are also instanced, the
  render resolution is capped, and post-processing runs without MSAA.

## Making it yours

The included Jordan Avery profile is a polished fictional demo. Edit
**`src/content.ts`** — it holds every name, section, and piece of résumé
text, plus which furniture props appear inside each building. Nothing else
needs to change.

Tuning knobs live in:

- `src/atmosphere.ts` — day length, weather targets, sky palettes
- `src/components/WeatherSystem.tsx` — auto-weather cadence, lightning timing
- `src/audio.ts` — ambient sound levels

## Architecture notes

Continuous per-frame values (sun position, rain intensity, wetness…) live in
a mutable singleton (`src/atmosphere.ts`) written once per frame by
`WeatherSystem` and read inside `useFrame` by every environment component —
so the sky can change every frame without a single React re-render. Discrete
UI state (current weather label, clock text, mute) goes through small zustand
stores (`src/store.ts`, `src/weatherStore.ts`).

The current experience has no runtime asset-CDN dependency: models, textures,
the world font, HDR lighting, and procedural effects are all served locally.
3D assets are Kenney CC0 model packs (see `CREDITS.md`).

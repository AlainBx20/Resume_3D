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
  ride the sky, the gradient dome repaints itself continuously, stars,
  shooting stars and fireflies come out at night, and the street lamps flicker
  awake at dusk before settling into warm pools of light.
- **Living landmarks** — the central fountain uses smooth curved water streams,
  a falling water curtain and expanding ripples, while a rock-lined woodland
  pond has swimming ducks, lily pads and wakes.
- **Terrain and navigation** — low procedural foothills blend into a varied
  ring of recolored low-poly mountain peaks. A live illustrated HUD map shows
  roads, numbered résumé buildings, the plaza fountain, pond and forest edge
  while tracking the visitor's position and facing direction.
- **True exterior doorways** — every interior exit opens onto a live 1:1 view
  of the same plaza, paths, fountain, buildings, trees, mountains and weather,
  rotated to match that house's real position in town.
- **Weather** — clear, rain, storm and snow, drifting automatically or forced
  with the number keys. Weather is *remembered by the world*: rain slicks the
  ground and leaves reflective puddles (and a rainbow once it clears), snow
  accumulates into a white blanket and melts later, wet footsteps create
  splash ripples, snow keeps temporary alternating footprints, wind bends the
  trees, shears chimney smoke and pushes the clouds.
- **Rain and storms** — 3,500 varied GPU-driven near/far streaks surround the
  camera, with low ground haze and instanced impact crowns/ripples. Tapered,
  branching lightning now fires in several pulses, throws a powerful local
  light across the town, and ends in a ground flare, shock ring and sparks.
  Thunder and rain use layered low, mid and high-frequency sound beds instead
  of a single noise filter. Cars become glossy when wet, receive dedicated
  roof/hood splash contacts, and produce nearby rain-on-metal patter.
- **Night lighting** — the textured moon is a real directional light source:
  buildings, trees and street furniture cast tuned soft moon shadows while
  windows and lamps provide warm contrast.
- **Town detail** — a marked two-lane perimeter road connects to a full entry
  lane, curves around the buildings and pond, and disappears into a lit rock
  tunnel at the world edge. Twenty-three measured, hand-placed street props
  add six plaza benches in cobbled garden nooks, six bins, six hydrants and
  five full-scale vehicles, all using locally served KayKit models. Vegetation
  is cleared from the asphalt; cars use tight oriented collision shapes and
  automatically switch on headlights and tail lights at night or in storms.
- **Achievements** — 71 persistent achievements now cover exploration,
  weather, time of day, movement, rooms, interactive props, secrets and the
  playable computer apps.
- **Procedural audio** — wind, rain, softer multi-layer thunder, surface-aware
  footsteps, nearby fountain/pond water and occasional bird calls are
  synthesized with the Web Audio API. Sound muffles when you step indoors.
- **Performance** — the forest is two GPU-instanced draw calls with wind sway
  done in the vertex shader; both rain layers and snow use static geometry
  animated entirely on the GPU. Procedural clouds, rain impacts, fountain droplets and pond
  stones are also instanced, the render resolution is capped, and the mountain
  range is only two merged meshes.

## Making it yours

The site is populated with Alaa Ben Chouikha's résumé. Everything lives in
**`src/content.ts`** — every name, section, and piece of résumé text, plus
which furniture props appear inside each building, and the label on each
interactive prop (labels map 1:1 by index to the matching content entries).
Nothing else needs to change to make it yours.

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
3D assets are Kenney CC0 model packs (see `CREDITS.md`), compressed with
gltf-transform `KHR_mesh_quantization` (~40% smaller, and read natively by
GLTFLoader with no decoder to ship). The two instanced tree models are left
unquantized because `InstancedTrees` reuses their raw geometry directly.

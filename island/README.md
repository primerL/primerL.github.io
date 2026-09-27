# Bo's Research Island

A standalone, static 3D companion to the academic homepage. Open `/island/` through the same HTTP server as the homepage. No build step or API keys are needed.

- WASD / arrows: move; E: interact. Click the terrain to walk or a destination sign to walk there and open it.
- Touch screens: use the directional pad or tap a sign.
- Research pages are saved in this browser's localStorage (`bo-island-notes`). The notebook's “Collect again” button resets this optional progress.
- The piano sounds only after interaction. Number keys 1–7 also play notes while its panel is open.
- The ? menu provides direct access to every destination without movement. Reduced-motion preference disables ambient movement and celebration effects.
- Keep `island/`, its `vendor/` directory, and the existing `assets/bo-li-graduation.png` together when deploying the static site. Three.js 0.180.0 is vendored under its MIT license; the original license is in `vendor/LICENSE`.

Content lives in `island.js`; layout and responsive styles in `island.css`. The original academic homepage remains at `../`.

## Painted coast edition

`painterly.js` creates shared bristle textures for small objects, meadow, and sand. The generated impasto sea material is in `assets/oil-sea.png`, with its complete generation prompt in `assets/oil-sea-prompt.md`. Cobalt/turquoise water, warm plaster and terracotta, cypress silhouettes, a paper frame, and the homepage's existing brush accents connect the game to the main site's painting. Piano interaction is retained, with transient note animations that honor reduced motion.

## Coastal village layout

The reference painting's white plaster houses, ochre roof tiles, shutters, cypresses, flowering terraces, and pale rock coastline now shape the 3D geometry. A shared heightfield places scenery and moving characters on the hillside; ground clicks raycast the terrain. Destination content, keyboard controls, note collection, and playable piano remain available.

## Sunlit water

`sea-light.js` layers saturated blue, emerald shallows, and broken golden reflections into the oil-painted sea material. Small elongated highlights pulse independently at gentle speeds using one shader uniform, without extra draw calls or additional image assets. Reduced-motion preference freezes the reflection animation.

## Background music

`music.js` synthesizes an original 16-bar piano loop at 72 BPM, with quiet filtered surf and a short reverb. No external recordings are fetched. Audio starts after an interaction; the Music button and volume slider persist their preferences locally. Opening the piano garden lowers the accompaniment to 20% of its current level, closing it restores the level, and hidden pages fade to silence and stop scheduling notes. Piano keys share the AudioContext but keep their own output level.

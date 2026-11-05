# Codevember

A collection of experiments by [shoreless](https://github.com/shoreless).

## Structure

- `index.html` — experiments archive
- `assets/style.css` — archive styles
- `2026/01/` — **Fold**, a Three.js paper sweet potato and golden-egg reveal
- `2026/02/` — **Shatter**, a page that breaks like an eggshell
- `2026/03/` — **Melt**, a dreary factory that softens into chocolate
- `assets/vendor/` — pinned Three.js r170 and its MIT license
- `.nojekyll` — serve the files directly on GitHub Pages

Each experiment lives at `YYYY/DD/`, with its own `index.html` and any local JS, CSS, or assets. Days use two digits. Keep links relative so the site works under GitHub Pages' `/codevember/` project path.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. No package installation or build step required.

## Publish

In repository **Settings → Pages**, choose **Deploy from a branch**, **main**, and **/ (root)**, then save. GitHub Pages will publish changes pushed to `main`.

Expected URL: https://shoreless.github.io/codevember/

## Add an experiment

1. Create `YYYY/DD/index.html` and keep experiment-specific assets in that folder.
2. Add a link under the matching year in the root `index.html`.
3. Use `../../` for the link back to the archive.
4. Commit and push.

## Day 01 — Fold

A 36-second, manually controlled animation. Play/pause, replay, or scrub the timeline; playback stops after the two sweet-potato characters finish their chase and never loops. Starts paused, including for reduced-motion preferences. Pauses when the tab is hidden.

The connected triangular sheet uses an original stylized folding choreography, not a physically exact origami crease pattern. The opaque purple shell conceals a larger golden egg before unfolding. The egg wobbles, cracks along zigzag seams and unfolds into six golden petals. Two original red sweet-potato characters with large white eyes and golden belly patches spring out, chase each other, then wave. All shell and character poses are deterministic functions of timeline time, so scrubbing backward restores each stage. Three.js is vendored locally so the experiment has no runtime CDN dependency.

Requires a browser with JavaScript and WebGL 2.

## Day 02 — Shatter

A 46-second, manually controlled 3D journey. Tap the golden egg or press Play. It cracks slowly; the cracks spread into the page, which breaks away as the camera enters an edible forest. The two sweet-potato guides from Fold steal stretchy fondant, snap a sugar frond, carry a piece of praline-filled chocolate, and settle on a biscuit log. One offers a little bite to the viewer. The journey ends in the clearing.

Play/pause, return to the egg, and scrub in either direction. All camera and character poses derive from the timeline, including the mushroom dent, missing fern frond, crumbs, and snacks. Playback starts paused, stops at the end, and pauses when the tab is hidden. With reduced motion enabled, Next steps through still scenes.

The forest, egg, page fragments, characters, and food are procedural Three.js geometry. The previous generated photograph is no longer used. Static scenery is batched by material to reduce WebGL draw calls. When WebGL is unavailable, a Canvas renderer projects the same 3D geometry with simpler lighting. The gallery shows only the unopened egg.

Validation: `node scripts/test-shatter.mjs` checks fracture coverage; `node scripts/test-forest.mjs` checks geometry and camera framing across portrait and landscape aspect ratios. No dependencies or build step are needed.

## Day 03 — Melt

A 34-second, manually controlled transformation. A concrete factory crowded with ducts, catwalks, a ventilation fan, fluorescent windows, and three smokestacks slowly loses its rigidity. Chimneys sag, pipes stretch, the lights darken, and the whole structure becomes chocolate before sinking into a spreading pool. The camera follows the collapse and finishes above a few chocolate bubbles.

The factory is original procedural Three.js geometry, batched by material. Every attached surface shares one deterministic deformation field, including the windows, rails, and pipe collars. Chocolate uses a clear-coated material and a procedural reflection environment. No generated images or remote runtime dependencies are used. A Canvas fallback projects the same geometry when WebGL is unavailable, with simplified lighting and reflections.

Melt/play/pause, restore, and timeline controls start paused, never loop, and support scrubbing backward. Playback pauses when the tab is hidden; reduced-motion preferences replace playback with still-scene steps. The gallery shows only the intact factory.

Validation: `node scripts/test-melt.mjs` checks finite geometry and normals, exact restoration after scrubbing, complete submersion, and camera framing at portrait and landscape sizes.

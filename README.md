# Codevember

A collection of experiments by [shoreless](https://github.com/shoreless).

## Structure

- `index.html` — experiments archive
- `assets/style.css` — archive and scaffold styles
- `2026/01/` — **Fold**, a Three.js paper sweet potato and golden-egg reveal
- `2026/02/` — **Shatter**, a page that breaks like an eggshell
- `2026/03/index.html` — unused Day 03 scaffold
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

Tap the page (or focus it and press Enter/Space). Cracks spread from the point of impact; the page, including its title and navigation, breaks into rotating shell fragments. A generated chocolate-garden photograph is revealed underneath. The restore button reverses the trick. No autoplay or looping.

Canvas 2D renders a deterministic Delaunay fracture mesh, so this experiment does not require WebGL. Animation pauses in hidden tabs. Reduced-motion preferences replace the flying fragments with a short fade. The local image must load before the trick is enabled; load failures offer a retry. Portrait layouts show the complete chocolate bar.

`chocolate-garden.webp` was generated for this experiment and is served locally. Its source PNG is retained outside the public repository. The gallery thumbnail deliberately shows only the intact page. Day 03 remains an unused scaffold.

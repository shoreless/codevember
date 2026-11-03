# Codevember

A collection of experiments by [shoreless](https://github.com/shoreless).

## Structure

- `index.html` — experiments archive
- `assets/style.css` — archive and scaffold styles
- `2026/01/` — **Fold**, a Three.js paper sweet potato and golden-egg reveal
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

An 18-second, manually controlled animation. Play/pause, replay, or scrub the timeline; playback stops at the reveal and never loops. Starts paused, including for reduced-motion preferences. Pauses when the tab is hidden.

The connected triangular sheet uses an original stylized folding choreography, not a physically exact origami crease pattern. The opaque purple shell conceals the golden egg before unfolding. Three.js is vendored locally so the experiment has no runtime CDN dependency.

Requires a browser with JavaScript and WebGL 2.

# Codevember

A collection of experiments by [shoreless](https://github.com/shoreless).

## Structure

- `index.html` — experiments archive
- `assets/style.css` — archive and scaffold styles
- `2026/03/index.html` — Day 03, currently a placeholder for the experiment
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

Day 03 is intentionally marked **In progress** until the experiment is ready.

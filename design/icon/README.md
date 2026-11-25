# App icon source

The Home Screen icon: Plusquito, the first monster you meet, in front of the Counting Cellar's
brick wall, lit by torchlight. Patterned on sound-box-crosswords' `design/icon/`.

| File | Layer (back to front) |
| --- | --- |
| `1-wall.svg` | The Cellar's bricks and the warm glow, full bleed |
| `2-plusquito.svg` | Plusquito, from `js/monsters.js` |
| `icon-all-layers.svg` | Both together, for previewing |

`make.mjs` draws them from the game's own art and colors (`node design/icon/make.mjs`), and
writes the browser tab's `favicon.svg` at the repo root. Change it and rerun rather than editing
the SVGs. All are 1024 × 1024 with no shading or rounded corners.

`full.icon` is the Icon Composer document made from them: Plusquito with glass and a shadow, on
the wall. It keeps its own copies of the layers in `full.icon/Assets/`, so after rerunning
`make.mjs`, copy the changed SVGs there (or re-add them in Icon Composer).

Nothing here is deployed. `site.py` makes the site's icons from `full.icon` (macOS, with Icon
Composer and Pillow: `python3 design/icon/site.py`): `icon-512.png` and `icon-192.png` (rounded,
see-through corners, for the manifest) and `apple-touch-icon.png` (180 px, square and opaque,
since iOS rounds it and shows see-through corners as black), converted from Display P3 to sRGB.

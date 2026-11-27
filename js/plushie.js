// Pluffy, the plus plushie: a soft stuffed + that sits in the grass by your captain on the start
// scene and squeaks when you tap it (app.js drawScene, descent.js surfaceHTML's `plush`). A toy,
// not a monster: Plusquito is the + monster, so Pluffy has every plush tell instead of a
// creature's: puffy, slightly lumpy arms, a stitched seam just inside the edge, button eyes, a
// sewn smile, felt specks, a heart patch and a sewn-in tag (striped, never a red cross, which reads as first aid). It never moves on its own (toys
// don't), only squishes when squeezed. No voice: it squeaks (sfx.squeak).
// Drawn in the house style (a dark outline, a color, a sheen) and made to read from 26 px up.
// No DOM, so the check can run it in Node.
import { DK, defs } from "./monsters.js";

export const PLUSH = { name: "Pluffy", c: "#7ad7e6", dark: "#3fa9bb" };
const W = "#f3efe4", CORAL = "#ff5a4e", PINK = "#ff8fa3", BUTTON = "#2b2440";

// The body: a + with puffy arms, their sides bulging a little and their ends domed, the inner
// corners rounded like stuffing pulling at a seam. Not quite even (the right arm a touch longer,
// the bottom one a touch fatter), so it looks sewn by hand. In a 120 × 120 box.
const BODY = "M41 32 Q39 16 47 10 Q60 4 73 10 Q81 16 79 32 Q79 41 88 41 Q104 39 111 46 Q117 60 111 75 Q104 81 88 79 "
  + "Q80 79 80 89 Q82 104 74 110 Q60 117 46 110 Q38 104 40 89 Q40 79 31 79 Q16 81 10 74 Q4 60 10 46 Q16 39 32 41 Q41 41 41 32Z";
// The seam: the same shape a size in, stitched (dashed) in thread a shade darker and lighter.
const SEAM = `<path d="${BODY}" transform="translate(60 60) scale(.84) translate(-60 -60)" fill="none"`;

// Pluffy as SVG. opts.cls: a class on the svg; opts.label: its name for screen readers (false
// hides it, when it's decoration next to a button that says it).
export function plushSvg(opts = {}) {
  const c = opts.color || PLUSH.c, dark = opts.dark || PLUSH.dark;
  const label = opts.label === false ? `aria-hidden="true"` : `role="img" aria-label="${opts.label || PLUSH.name}"`;
  const felt = `<pattern id="plushFelt" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="#fff" opacity=".22"/><circle cx="6.5" cy="6" r=".8" fill="${DK}" opacity=".08"/></pattern>`;
  const button = (x, y) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${BUTTON}" stroke="${DK}" stroke-width="2.5"/>`
    + `<circle cx="${x}" cy="${y}" r="5.6" fill="none" stroke="#5b4f80" stroke-width="1.6"/>`
    + `<circle cx="${x - 2}" cy="${y - .5}" r="1.3" fill="${W}" opacity=".85"/><circle cx="${x + 2}" cy="${y - .5}" r="1.3" fill="${W}" opacity=".85"/>`
    + `<path d="M${x - 2} ${y - .5} L${x + 2} ${y - .5}" stroke="${W}" stroke-width=".9" opacity=".6"/>`
    + `<circle cx="${x - 3.6}" cy="${y - 4}" r="1.6" fill="#fff" opacity=".55"/>`;
  return `<svg viewBox="-4 -4 128 128" class="${opts.cls || ""}" ${label}>${defs}<defs>${felt}</defs>`
    // The tag, sewn into the bottom of the right arm: a cream label with a coral stripe.
    + `<path d="M95 77 L103 94 L92 98 L86 80Z" fill="${W}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M90.5 85 L97.5 82.2 M92.2 89.5 L99 86.8" stroke="${CORAL}" stroke-width="1.8" stroke-linecap="round"/>`
    // The body: outline, fill, felt, sheen.
    + `<path d="${BODY}" fill="${DK}" stroke="${DK}" stroke-width="8" stroke-linejoin="round"/>`
    + `<path d="${BODY}" fill="${c}"/><path d="${BODY}" fill="url(#plushFelt)"/><path d="${BODY}" fill="url(#sh)"/>`
    // A soft shade along the bottom, where it sags.
    + `<path d="M46 110 Q60 117 74 110 Q72 102 60 103 Q48 102 46 110Z M10 74 Q16 81 31 79 Q24 72 13 71Z M111 75 Q104 81 88 79 Q96 72 108 71Z" fill="${dark}" opacity=".45"/>`
    // The seam, stitched.
    + `${SEAM} stroke="${dark}" stroke-width="2.6" stroke-dasharray="4.5 3.5" stroke-linecap="round"/>`
    + `${SEAM} stroke="#fff" stroke-width="1.2" stroke-dasharray="4.5 3.5" stroke-linecap="round" opacity=".5"/>`
    // The heart patch on the bottom arm, blanket-stitched on.
    + `<path d="M60 104 C50 97 50 89 55 88 C58 87.5 60 90 60 91.5 C60 90 62 87.5 65 88 C70 89 70 97 60 104Z" fill="${CORAL}" stroke="${DK}" stroke-width="2.4" stroke-linejoin="round"/>`
    + `<path d="M60 100.5 C53 95.5 53 90.5 56 90.4 M64 90.4 C67 90.5 67 95.5 60 100.5" fill="none" stroke="${W}" stroke-width="1.1" stroke-dasharray="2 2" opacity=".75"/>`
    // The face: rosy cheeks, button eyes, a smile sewn in thread.
    + `<ellipse cx="42" cy="70" rx="6.5" ry="4.2" fill="${PINK}" opacity=".7"/><ellipse cx="78" cy="70" rx="6.5" ry="4.2" fill="${PINK}" opacity=".7"/>`
    + button(48, 57) + button(72, 57)
    + `<path d="M51 70 Q60 79 69 70" fill="none" stroke="${DK}" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M51 70 l-1.6 -2.6 M69 70 l1.6 -2.6" stroke="${DK}" stroke-width="2.2" stroke-linecap="round"/>`
    + `</svg>`;
}

// A little heart that pops up when Pluffy is squeezed.
export const PLUSH_HEART = `<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20 C3 14 1 8 5 4.5 C8 2 11 4 12 6 C13 4 16 2 19 4.5 C23 8 21 14 12 20Z" fill="${CORAL}" stroke="${DK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;

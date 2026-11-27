// Pluffy, the plus plushie (js/plushie.js): it draws cleanly, has a name, and sits by the captain
// (or the door) on the start scene's surface (descent.js surfaceHTML) only when asked.
import assert from "node:assert/strict";
import { plushSvg, PLUSH, PLUSH_HEART } from "../js/plushie.js";

// descent.js loads sfx.js, which listens for taps: a stand-in document and window for Node.
globalThis.document = globalThis.document || { addEventListener() {}, removeEventListener() {} };
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.window = globalThis.window || globalThis;
const { surfaceHTML } = await import("../js/descent.js");

const clean = (s, what) => {
  assert.ok(s.startsWith("<svg") && s.endsWith("</svg>"), what);
  assert.ok(!/<text\b/.test(s), `${what}: shapes, not fonts`);
  assert.ok(!/undefined|NaN|null|\[object/.test(s), `${what}: ${(s.match(/.{30}(undefined|NaN|null|\[object).{10}/) || [])[0]}`);
};
assert.equal(PLUSH.name, "Pluffy");
clean(plushSvg(), "Pluffy");
clean(plushSvg({ label: false }), "Pluffy, unlabelled");
clean(PLUSH_HEART, "the heart");
assert.match(plushSvg(), /role="img" aria-label="Pluffy"/);
assert.match(plushSvg({ label: false }), /aria-hidden="true"/);

// On the surface: only with `plush`, and inside the screen, with or without a captain.
const cap = { svg: "<svg></svg>", role: "cap" };
assert.ok(!surfaceHTML({ W: 375, H: 667, hz: 150, heroes: [cap] }).includes("d-plush"));
for (const heroes of [[cap], [], [cap, { svg: "<svg></svg>", role: "team" }]]) {
  for (const W of [320, 375, 820, 1280]) {
    const html = surfaceHTML({ W, H: 700, hz: 160, heroes, plush: plushSvg() });
    const m = html.match(/class="d-plush" style="left:(-?\d+)px;top:(-?\d+)px;width:(\d+)px/);
    assert.ok(m, "Pluffy is on the surface");
    const [left, top, w] = m.slice(1).map(Number);
    assert.ok(left >= 0 && left + w <= W && top > 0 && top < 160 && w >= 24, `Pluffy in view at ${W} px: ${left}, ${top}, ${w}`);
  }
}
console.log("plushie: ok");

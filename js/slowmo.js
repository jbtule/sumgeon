// The Hero Moment itself (DESIGN.md §8.4), like a video editor's jog shuttle, about 2 s:
//   1. wind-down: the hero lifts out of the answer and flies at normal speed, then time drags to
//      a quarter speed (a tape slowing down) and the room dims a little;
//   2. close-up: the hero swells toward the camera, the room zooms a little, the edges blur;
//   3. freeze: the quip in a speech bubble, said in the quip voice, over a slow heartbeat; a
//      reverse cymbal swells into
//   4. snap: time snaps back at double speed and the hero whips into the monster with their own
//      move (heroes.js `move`);
//   5. hit: a bigger impact and a screen shake. The caller then shows the damage, as for any hit.
// With reduced motion there's no zoom or speed ramp: the hero, the bubble and the hit.
// A team-up (two heroes, playTeamUp below) runs the same phases with both side by side.
//
// Used by the game (app.js) and the review page (moments/), so both play exactly this. Its styles
// are here too, injected once, so the review page needn't load the game's stylesheet.
import { HEROES, heroSvg } from "./heroes.js";
import * as sfx from "./sfx.js";

export const PHASES = ["wind-down", "close-up", "freeze", "snap", "hit"];
// Each hero's move: how they whip in (dash: straight, fist-first; arc: over the top; drop: up
// and stomp down; vanish: gone, then strike from behind) and what flashes on impact.
export const MOVES = {
  0: { path: "dash", fx: "💥" }, // Zeroic flies in fist-first
  1: { path: "arc", fx: "💫" }, // Onesie's pillow bonk
  2: { path: "vanish", fx: "🎩" }, // Twodini: out of a top hat
  3: { path: "dash", fx: "✨", flash: true }, // Threasure Hunter's lantern flash
  4: { path: "dash", fx: "🛡️" }, // Sir Fourtress's shield bash
  5: { path: "arc", fx: "✋" }, // High Five's giant high five
  6: { path: "dash", fx: "🔍" }, // Sixlock Holmes spots the weak point
  7: { path: "drop", fx: "💥" }, // Sevenstein's big stomp
  8: { path: "arc", fx: "🍽️" }, // Chef Eight serves it on a sizzling platter
  9: { path: "vanish", fx: "💨" } // Nine-ja vanishes, then strikes from behind
};
// Base timings in ms at 1× (speed ½ doubles them).
export const TIMING = { wind: 480, close: 360, freezeMin: 1000, freezeMax: 2400, swell: 380, snap: 230, after: 260 };

const CSS = `
.hm{position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden}
.hm-dim{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 46%,#05090b30 0,#05090b80 100%);opacity:0}
.hm-edge{position:absolute;inset:0;opacity:0;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);
  -webkit-mask-image:radial-gradient(ellipse 62% 56% at 50% 46%,transparent 55%,#000 100%);mask-image:radial-gradient(ellipse 62% 56% at 50% 46%,transparent 55%,#000 100%)}
.hm-lines{position:absolute;inset:0;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 46%,#ffffff00 0 4deg,#ffffff10 4deg 5deg)}
.hm-hero{position:absolute;left:0;top:0;width:120px;height:128px;will-change:transform;filter:drop-shadow(0 6px 10px #0009)}
.hm-hero svg{width:100%;height:100%;overflow:visible;display:block}
.hm-bubble{position:absolute;left:0;top:0;max-width:min(84vw,420px);padding:10px 18px;border-radius:22px;background:#f3efe4;color:#0c171c;
  border:4px solid #0c171c;box-shadow:0 6px 0 #0c171c55;font:900 clamp(20px,5.6vw,30px)/1.15 Nunito,system-ui,sans-serif;text-align:center;opacity:0;transform-origin:50% 100%}
.hm-bubble::after{content:"";position:absolute;left:50%;bottom:-16px;margin-left:-12px;border:12px solid transparent;border-top:14px solid #0c171c;border-bottom:0}
.hm-bubble::before{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-8px;border:8px solid transparent;border-top:10px solid #f3efe4;border-bottom:0;z-index:1}
.hm-fx{position:absolute;left:0;top:0;font-size:56px;line-height:1;opacity:0}
.hm-flash{position:absolute;inset:0;background:#fff8d6;opacity:0}
`;
let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
// Runs fn(p) each frame for ms, p from 0 to 1.
function tween(ms, fn) {
  return new Promise((done) => {
    const t0 = performance.now();
    fn(0);
    const frame = (now) => { const p = Math.min(1, (now - t0) / ms); fn(p); if (p < 1) requestAnimationFrame(frame); else done(); };
    requestAnimationFrame(frame);
  });
}
function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
const HW = 120, HH = 128; // the hero box, before scaling
function place(el, x, y, s, rot) { el.style.transform = `translate(${x - HW / 2}px,${y - HH / 2}px) scale(${s})${rot ? ` rotate(${rot}deg)` : ""}`; }
function bez(p0, c, p1, t) { const u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; }

// Plays a moment. o:
//   hero: digit; color: the captain's chalk color, or null; quip: the words in the bubble;
//   speak(): says the quip, resolving when it's done (or at once with the voice off);
//   from: the answer box; to: the monster; room: what zooms and shakes (the game);
//   speed: 1 or 0.5; reduced: reduced motion; gate(phase): awaited before each phase (the review
//   page's Step); onPhase(phase): told as each starts; onSnap(): the snap starts (the answer's
//   other digits fly then);
//   partner: a team-up's second hero (on the right; hero is on the left), and partnerColor.
// Resolves at the hit, then tidies up by itself.
export async function playMoment(o) {
  style();
  if (o.partner != null) return playTeamUp(o);
  const k = 1 / (o.speed || 1), T = (ms) => ms * k, h = HEROES[o.hero], move = MOVES[o.hero];
  const room = o.room, phase = async (p) => { if (o.gate) await o.gate(p); if (o.onPhase) o.onPhase(p); };
  const layer = document.createElement("div");
  layer.className = "hm";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `<div class="hm-dim"></div><div class="hm-edge"></div><div class="hm-lines"></div><div class="hm-flash"></div>
    <div class="hm-hero">${heroSvg(h, { color: o.color || null })}</div><div class="hm-fx">${move.fx}</div><div class="hm-bubble"></div>`;
  document.body.appendChild(layer);
  const q = (c) => layer.querySelector(c), hero = q(".hm-hero"), bub = q(".hm-bubble"), dim = q(".hm-dim"), edge = q(".hm-edge"), lines = q(".hm-lines"), fx = q(".hm-fx"), flash = q(".hm-flash");
  bub.textContent = o.quip;
  const a = centerOf(o.from), b = centerOf(o.to), W = innerWidth, H = innerHeight;
  const c = { x: W / 2, y: H * 0.5 }, big = Math.min(W * 0.6, H * 0.36, 320) / HW, small = 62 / HW;
  // The bubble sits over the close-up, inside the screen.
  const showBubble = (s) => {
    const r = bub.getBoundingClientRect(), top = Math.max(8, c.y - HH * s / 2 - r.height - 18);
    bub.style.transform = `translate(${Math.round(c.x - r.width / 2)}px,${Math.round(top)}px)`;
  };
  // The room zooms in on the monster (measured before any zoom).
  const rr = room ? room.getBoundingClientRect() : null;
  const zoom = (z) => { if (room) { room.style.transformOrigin = `${b.x - rr.left}px ${b.y - rr.top}px`; room.style.transform = z === 1 ? "" : `scale(${z})`; } };

  if (o.reduced) {
    // No zoom, no speed ramp: the hero, the quip and the hit.
    await phase("close-up");
    dim.style.opacity = "0.7"; place(hero, c.x, c.y, big * 0.8);
    await phase("freeze");
    bub.style.opacity = "1"; showBubble(big * 0.8);
    sfx.heartbeat();
    const t0 = performance.now();
    await Promise.race([Promise.resolve(o.speak && o.speak()), sleep(T(TIMING.freezeMax))]);
    const left = T(TIMING.freezeMin) - (performance.now() - t0);
    if (left > 0) await sleep(left);
    await phase("snap");
    if (o.onSnap) o.onSnap();
    await phase("hit");
    hero.style.opacity = "0"; bub.style.opacity = "0";
    sfx.slam();
    setTimeout(() => layer.remove(), T(TIMING.after));
    return;
  }

  // 1. Wind-down: along the arc toward the monster, time dragging from 1× to ¼×.
  await phase("wind-down");
  sfx.tapeStop(T(TIMING.wind) / 1000 + 0.1);
  const arcC = { x: (a.x + b.x) / 2 + (b.x - a.x) * 0.15, y: Math.min(a.y, b.y) - 90 };
  let at = { x: a.x, y: a.y }, rot = 0;
  // Progress along the arc: rate falls from 1 to ¼ over the phase, so it covers about 40%.
  await tween(T(TIMING.wind), (p) => {
    const travelled = 0.62 * (p - 0.375 * p * p); // ∫ (1 − 0.75p) dp, scaled
    at = bez(a, arcC, b, travelled);
    rot = travelled * 200;
    place(hero, at.x, at.y, small * (1 + 0.4 * travelled), rot);
    dim.style.opacity = String(0.6 * p);
  });

  // 2. Close-up: the hero swells toward the camera; a slight zoom, blur at the edges.
  await phase("close-up");
  const from = at, rot0 = rot % 360;
  await tween(T(TIMING.close), (p) => {
    const e = ease(p);
    place(hero, lerp(from.x, c.x, e), lerp(from.y, c.y, e), lerp(small * 1.2, big, e), lerp(rot0, 360, e) % 360);
    edge.style.opacity = String(e); lines.style.opacity = String(e * 0.8);
    dim.style.opacity = String(0.6 + 0.4 * e);
    zoom(1 + 0.06 * e);
  });

  // 3. Freeze: the quip, a beat, a heartbeat; then the swell into the snap.
  await phase("freeze");
  bub.style.opacity = "1"; showBubble(big);
  bub.animate([{ transform: bub.style.transform + " scale(.4)", opacity: 0 }, { transform: bub.style.transform + " scale(1.06)", opacity: 1, offset: 0.7 }, { transform: bub.style.transform, opacity: 1 }], { duration: T(180), easing: "ease-out" });
  sfx.heartbeat();
  const beats = setInterval(() => sfx.heartbeat(), T(1000));
  // The hero breathes a little while frozen.
  const breathe = hero.animate([{ filter: "drop-shadow(0 6px 10px #0009) brightness(1)" }, { filter: "drop-shadow(0 0 18px #ffc93c) brightness(1.15)" }], { duration: T(700), direction: "alternate", iterations: Infinity });
  const t0 = performance.now();
  await Promise.race([Promise.resolve(o.speak && o.speak()), sleep(T(TIMING.freezeMax))]);
  const left = T(TIMING.freezeMin) - (performance.now() - t0);
  if (left > 0) await sleep(left);
  clearInterval(beats);
  sfx.swell(T(TIMING.swell) / 1000);
  await tween(T(TIMING.swell), (p) => { place(hero, c.x, c.y, big * (1 + 0.08 * easeIn(p)), -6 * easeIn(p)); });
  breathe.cancel();

  // 4. Snap: double speed, the hero's own move, the room snapping back to normal.
  await phase("snap");
  bub.style.opacity = "0";
  if (o.onSnap) o.onSnap();
  sfx.whip();
  const behind = { x: b.x + (b.x < W / 2 ? 1 : -1) * Math.min(140, W * 0.3), y: b.y - 30 };
  await tween(T(TIMING.snap), (p) => {
    const e = easeIn(p), s = lerp(big, small * 1.3, ease(p));
    edge.style.opacity = lines.style.opacity = String(1 - p);
    dim.style.opacity = String(1 - 0.5 * p);
    zoom(lerp(1.06, 1, p));
    if (move.path === "dash") {
      const ang = Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
      place(hero, lerp(c.x, b.x, e), lerp(c.y, b.y, e), s, lerp(0, ang + 90, Math.min(1, p * 3)));
    } else if (move.path === "arc") {
      const pt = bez(c, { x: (c.x + b.x) / 2, y: Math.min(c.y, b.y) - 160 }, b, e);
      place(hero, pt.x, pt.y, s, lerp(0, -40, e));
    } else if (move.path === "drop") {
      const up = { x: b.x, y: b.y - 170 }, pt = p < 0.55 ? { x: lerp(c.x, up.x, ease(p / 0.55)), y: lerp(c.y, up.y, ease(p / 0.55)) } : { x: b.x, y: lerp(up.y, b.y, easeIn((p - 0.55) / 0.45)) };
      place(hero, pt.x, pt.y, s, 0);
    } else { // vanish, then strike from behind
      if (p < 0.45) { hero.style.opacity = String(1 - p / 0.45); place(hero, c.x, c.y, lerp(big, big * 0.5, p / 0.45), 0); }
      else { const u = (p - 0.45) / 0.55; hero.style.opacity = "1"; place(hero, lerp(behind.x, b.x, easeIn(u)), lerp(behind.y, b.y, easeIn(u)), small * 1.3, lerp(-30, 0, u)); }
    }
  });
  zoom(1);

  // 5. Hit: the bigger impact, the move's flourish, a screen shake.
  await phase("hit");
  sfx.slam();
  fx.style.transform = `translate(${b.x - 28}px,${b.y - 60}px)`;
  fx.animate([{ opacity: 0, transform: fx.style.transform + " scale(.4)" }, { opacity: 1, transform: fx.style.transform + " scale(1.3)", offset: 0.35 }, { opacity: 0, transform: fx.style.transform + " translateY(-30px) scale(1)" }], { duration: T(700), easing: "ease-out", fill: "forwards" });
  if (move.flash) flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: T(320), easing: "ease-out", fill: "forwards" });
  hero.animate([{ opacity: 1 }, { opacity: 0, transform: hero.style.transform + " scale(.4)" }], { duration: T(160), fill: "forwards" });
  if (room) room.animate([{ transform: "none" }, { transform: "translate(-9px,5px)" }, { transform: "translate(8px,-6px)" }, { transform: "translate(-6px,3px)" }, { transform: "translate(4px,-2px)" }, { transform: "none" }], { duration: T(380) });
  // Tidy up: the dim fades, the layer goes.
  tween(T(TIMING.after), (p) => { dim.style.opacity = String(0.5 * (1 - p)); }).then(() => setTimeout(() => layer.remove(), T(500)));
  if (room) { room.style.transform = ""; room.style.transformOrigin = ""; }
}

/* ---------- a team-up: two heroes at once (moments.js TEAMUP) ----------
   The same phases, with both heroes: they lift out of the answer together and swell in side by
   side, the tens hero on the left and the ones hero on the right, under one bubble. At the snap
   they whip out to opposite sides and in again, crossing at the monster, and land together with
   one bigger slam. With reduced motion: both heroes, the bubble and the hit. */
async function playTeamUp(o) {
  const k = 1 / (o.speed || 1), T = (ms) => ms * k, ds = [o.hero, o.partner];
  const room = o.room, phase = async (p) => { if (o.gate) await o.gate(p); if (o.onPhase) o.onPhase(p); };
  const layer = document.createElement("div");
  layer.className = "hm";
  layer.setAttribute("aria-hidden", "true");
  const colors = [o.color || null, o.partnerColor || null];
  layer.innerHTML = `<div class="hm-dim"></div><div class="hm-edge"></div><div class="hm-lines"></div><div class="hm-flash"></div>
    ${ds.map((d, i) => `<div class="hm-hero">${heroSvg(HEROES[d], { color: colors[i] })}</div>`).join("")}
    ${ds.map((d) => `<div class="hm-fx">${MOVES[d].fx}</div>`).join("")}<div class="hm-bubble"></div>`;
  document.body.appendChild(layer);
  const q = (c) => layer.querySelector(c), all = (c) => [...layer.querySelectorAll(c)];
  const heroes = all(".hm-hero"), fxs = all(".hm-fx"), bub = q(".hm-bubble"), dim = q(".hm-dim"), edge = q(".hm-edge"), lines = q(".hm-lines"), flash = q(".hm-flash");
  bub.textContent = o.quip;
  const a = centerOf(o.from), b = centerOf(o.to), W = innerWidth, H = innerHeight;
  // Side by side: each a little smaller than a solo close-up, so both fit a phone's width.
  const c = { x: W / 2, y: H * 0.5 }, big = Math.min(W * 0.36, H * 0.3, 240) / HW, small = 56 / HW;
  const dx = HW * big * 0.56, side = [-1, 1], at = side.map((s) => ({ x: c.x + s * dx, y: c.y }));
  const showBubble = (s) => {
    const r = bub.getBoundingClientRect(), top = Math.max(8, c.y - HH * s / 2 - r.height - 18);
    bub.style.transform = `translate(${Math.round(c.x - r.width / 2)}px,${Math.round(top)}px)`;
  };
  const rr = room ? room.getBoundingClientRect() : null;
  const zoom = (z) => { if (room) { room.style.transformOrigin = `${b.x - rr.left}px ${b.y - rr.top}px`; room.style.transform = z === 1 ? "" : `scale(${z})`; } };
  // The freeze holds for the quip: at least freezeMin, at most freezeMax.
  const hold = async () => {
    const t0 = performance.now();
    await Promise.race([Promise.resolve(o.speak && o.speak()), sleep(T(TIMING.freezeMax))]);
    const left = T(TIMING.freezeMin) - (performance.now() - t0);
    if (left > 0) await sleep(left);
  };

  if (o.reduced) {
    await phase("close-up");
    dim.style.opacity = "0.7";
    heroes.forEach((el, i) => place(el, at[i].x, at[i].y, big * 0.85));
    await phase("freeze");
    bub.style.opacity = "1"; showBubble(big * 0.85);
    sfx.heartbeat();
    await hold();
    await phase("snap");
    if (o.onSnap) o.onSnap();
    await phase("hit");
    heroes.forEach((el) => (el.style.opacity = "0")); bub.style.opacity = "0";
    sfx.slam(true);
    setTimeout(() => layer.remove(), T(TIMING.after));
    return;
  }

  // 1. Wind-down: both lift out of the answer, side by side, time dragging to ¼×.
  await phase("wind-down");
  sfx.tapeStop(T(TIMING.wind) / 1000 + 0.1);
  const starts = side.map((s) => ({ x: a.x + s * 22, y: a.y }));
  const arcC = { x: (a.x + b.x) / 2 + (b.x - a.x) * 0.15, y: Math.min(a.y, b.y) - 90 };
  let now = starts.slice(), rot = [0, 0];
  await tween(T(TIMING.wind), (p) => {
    const travelled = 0.55 * (p - 0.375 * p * p);
    heroes.forEach((el, i) => {
      const pt = bez(starts[i], arcC, { x: b.x + side[i] * 40, y: b.y }, travelled);
      now[i] = pt; rot[i] = side[i] * travelled * 200;
      place(el, pt.x, pt.y, small * (1 + 0.4 * travelled), rot[i]);
    });
    dim.style.opacity = String(0.6 * p);
  });

  // 2. Close-up: both swell toward the camera, side by side.
  await phase("close-up");
  const from = now.slice(), rot0 = rot.map((x) => x % 360);
  await tween(T(TIMING.close), (p) => {
    const e = ease(p);
    heroes.forEach((el, i) => place(el, lerp(from[i].x, at[i].x, e), lerp(from[i].y, at[i].y, e), lerp(small * 1.2, big, e), lerp(rot0[i], 0, e)));
    edge.style.opacity = String(e); lines.style.opacity = String(e * 0.8);
    dim.style.opacity = String(0.6 + 0.4 * e);
    zoom(1 + 0.06 * e);
  });

  // 3. Freeze: one bubble over both, the heartbeat, then the swell into the snap.
  await phase("freeze");
  bub.style.opacity = "1"; showBubble(big);
  bub.animate([{ transform: bub.style.transform + " scale(.4)", opacity: 0 }, { transform: bub.style.transform + " scale(1.06)", opacity: 1, offset: 0.7 }, { transform: bub.style.transform, opacity: 1 }], { duration: T(180), easing: "ease-out" });
  sfx.heartbeat();
  const beats = setInterval(() => sfx.heartbeat(), T(1000));
  const breathe = heroes.map((el, i) => el.animate([{ filter: "drop-shadow(0 6px 10px #0009) brightness(1)" }, { filter: "drop-shadow(0 0 18px #ffc93c) brightness(1.15)" }], { duration: T(700), delay: T(i * 350), direction: "alternate", iterations: Infinity }));
  await hold();
  clearInterval(beats);
  sfx.swell(T(TIMING.swell) / 1000);
  // They lean in toward each other.
  await tween(T(TIMING.swell), (p) => { heroes.forEach((el, i) => place(el, at[i].x - side[i] * 6 * easeIn(p), at[i].y, big * (1 + 0.08 * easeIn(p)), side[i] * 8 * easeIn(p))); });
  breathe.forEach((x) => x.cancel());

  // 4. Snap: each whips out to its own side and in again, crossing at the monster. The second
  //    starts a beat after the first, with its own whoosh.
  await phase("snap");
  bub.style.opacity = "0";
  if (o.onSnap) o.onSnap();
  sfx.whip();
  const lag = 0.14, dur = T(TIMING.snap * 1.6);
  setTimeout(() => sfx.whip(), dur * lag);
  const reach = Math.min(W * 0.42, 280);
  const out = side.map((s) => ({ x: Math.max(28, Math.min(W - 28, b.x + s * reach)), y: b.y - 50 }));
  const land = side.map((s) => ({ x: b.x - s * 26, y: b.y + 6 })); // past the monster: they cross
  await tween(dur, (p) => {
    edge.style.opacity = lines.style.opacity = String(1 - p);
    dim.style.opacity = String(1 - 0.5 * p);
    zoom(lerp(1.06, 1, p));
    heroes.forEach((el, i) => {
      const u = Math.max(0, Math.min(1, (p - i * lag) / (1 - lag)));
      const s = lerp(big, small * 1.4, ease(u));
      let pt, r;
      if (u < 0.4) { const v = ease(u / 0.4); pt = { x: lerp(at[i].x, out[i].x, v), y: lerp(at[i].y, out[i].y, v) }; r = side[i] * 200 * v; }
      else { const v = easeIn((u - 0.4) / 0.6); pt = { x: lerp(out[i].x, land[i].x, v), y: lerp(out[i].y, land[i].y, v) }; r = side[i] * (200 + 160 * v); }
      place(el, pt.x, pt.y, s, r);
    });
  });
  zoom(1);

  // 5. Hit: one bigger slam, both flourishes, a bigger shake.
  await phase("hit");
  sfx.slam(true);
  fxs.forEach((el, i) => {
    el.style.transform = `translate(${b.x - 28 + side[i] * 34}px,${b.y - 60 - i * 14}px)`;
    el.animate([{ opacity: 0, transform: el.style.transform + " scale(.4)" }, { opacity: 1, transform: el.style.transform + " scale(1.35)", offset: 0.35 }, { opacity: 0, transform: el.style.transform + " translateY(-30px) scale(1)" }], { duration: T(760), delay: T(i * 60), easing: "ease-out", fill: "both" });
  });
  if (ds.some((d) => MOVES[d].flash)) flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: T(320), easing: "ease-out", fill: "forwards" });
  heroes.forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0, transform: el.style.transform + " scale(.4)" }], { duration: T(180), fill: "forwards" }));
  if (room) room.animate([{ transform: "none" }, { transform: "translate(-12px,7px)" }, { transform: "translate(11px,-8px)" }, { transform: "translate(-8px,5px)" }, { transform: "translate(6px,-3px)" }, { transform: "translate(-3px,1px)" }, { transform: "none" }], { duration: T(460) });
  tween(T(TIMING.after), (p) => { dim.style.opacity = String(0.5 * (1 - p)); }).then(() => setTimeout(() => layer.remove(), T(500)));
  if (room) { room.style.transform = ""; room.style.transformOrigin = ""; }
}

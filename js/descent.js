// The descent (DESIGN.md §8.3): tapping "Enter the dungeon" drops the camera through the strata,
// about 2 s. The start card falls away (app.js), then a full-screen stack of the depth map's rock
// layers (the grass on top, then each stratum in its own wall and colors, WINGS order) scrolls up
// as if falling past them, easing to a stop on the chosen depth's marker in the chosen stratum.
// "Now entering the Sumgeon!" slams in partway down (the voice starts on the tap), and on landing
// the stratum's name and depth show, with a whoomp. Then the run starts underneath (onReady) and
// the overlay fades away into the room.
//
// "Go deeper" plays a short version, one depth down inside the stratum, titled "Depth N". With
// reduced motion it's a quick fade with the title and no fall. Any tap or key skips straight to
// the fight; until the overlay is gone, no input reaches the game. Timings: wings.js descentPlan.
import { WINGS, descentPlan, isMega } from "./wings.js";
import * as sfx from "./sfx.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let active = null;
export const descending = () => !!active;

// The surface: the night sky with its stars over a grassy hilltop, the Sumgeon's arched door on
// top of the hill, and the team standing by it. The start screen (app.js drawScene) shows it
// behind its card, and the descent starts from the very same frame, so tapping Enter is one move
// down from the start scene into the fight. It's one screen tall (H px, W wide), with the flat
// grass line hz px from the top. heroes: [{ svg, role: "cap" | "team" }]: the captain
// stands left of the door; the team, smaller, around and behind it, alternating right and left;
// with nobody picked, none. The idle (twinkling stars, a slight
// bob) runs off the page clock (--t0), so the descent's copy carries on in step with the start
// scene's.
const STARS = [[6, 10, 2, 0], [14, 34, 1.5, 1.2], [22, 16, 2.5, 2.1], [31, 48, 1.5, .6], [38, 8, 2, 2.9], [47, 28, 1.5, 1.7], [55, 12, 2, .3], [63, 40, 1.5, 2.5],
  [70, 20, 2.5, 1.1], [78, 6, 1.5, 2.2], [86, 30, 2, .8], [93, 14, 1.5, 1.9], [10, 60, 1.5, 2.7], [90, 56, 1.5, 1.4], [27, 70, 1, .4], [74, 66, 1, 2]];
// stall: Trollar's stall (chest.js stallSvg), right of the door, behind the team (.d-stall, so
// the start screen can put its tap target over it).
export function surfaceHTML({ W, H, hz, heroes = [], stall = "" }) {
  hz = Math.round(hz);
  const door = Math.round(Math.max(64, Math.min(200, hz * 0.5, H * 0.24, W * 0.36))), doorW = Math.round(door * 0.72);
  const bulge = Math.round(door * 0.22), hillW = Math.round(Math.min(W * 1.1, door * 5.6)), doorAt = hz - Math.round(bulge * 0.92);
  const stars = STARS.map(([x, y, r, d]) => `<i class="d-star" style="left:${x}%;top:${y}%;width:${r * 2}px;height:${r * 2}px;--d:${d}s"></i>`).join("");
  const cap = heroes.find((h) => h.role === "cap"), rest = heroes.filter((h) => h !== cap);
  const capW = Math.round(door * 0.92), side = (W - doorW) / 2 - 6;
  const perSide = Math.ceil(rest.length / 2) || 1, room = side - (cap ? capW * 0.9 : 0);
  const tW = Math.round(Math.max(26, Math.min(door * 0.62, (room / perSide) * 1.35)));
  const fig = (h, cx, feet, w, z, i) => `<span class="d-hero ${h.role}" style="left:${Math.round(W / 2 + cx - w / 2)}px;top:${Math.round(feet - w * 1.02)}px;width:${w}px;z-index:${z};--d:${((i * 0.37) % 2.4).toFixed(2)}s">${h.svg}</span>`;
  let figs = "";
  if (cap) figs += fig(cap, -(doorW / 2 + capW * 0.42), hz + Math.round(bulge * 0.15), capW, 5, 0);
  rest.forEach((h, i) => {
    // With the stall on the right, the team fills the left first, so Trollar shows.
    const right = i % 2 === (stall ? 1 : 0), k = Math.floor(i / 2), out = doorW / 2 + tW * 0.5 + k * tW * 0.72 + (right || !cap ? 4 : capW * 0.78);
    figs += fig(h, right ? out : -out, hz - Math.round(bulge * 0.35) - k * 3, tW, 4 - k, i + 1);
  });
  let shop = "";
  if (stall) {
    // Past the first hero on the right where there's room (iPad, desktop), so they stand by
    // it rather than in front of it; on a phone, as far right as it fits.
    const sw = Math.round(door * 0.95), sh = Math.round(sw * 220 / 212);
    const cx = Math.min(W / 2 + doorW / 2 + (rest.length > 1 ? tW * 0.95 : 0) + sw * 0.6, W - sw / 2 - 4);
    shop = `<span class="d-stall" style="left:${Math.round(cx - sw / 2)}px;top:${Math.round(hz + bulge * 0.1 - sh * 0.97)}px;width:${sw}px;height:${sh}px">${stall}</span>`;
  }
  return `<div class="d-surface" style="height:${H}px;--t0:${-Math.round(performance.now())}ms">
    <div class="d-sky" style="height:${hz}px">${stars}</div>
    <div class="d-grass" style="height:${H - hz}px"></div>
    <i class="d-hill" style="left:${Math.round((W - hillW) / 2)}px;top:${hz - bulge}px;width:${hillW}px;height:${bulge + 3}px"></i>
    <i class="d-door" style="left:${Math.round((W - doorW) / 2)}px;top:${doorAt - door}px;width:${doorW}px;height:${door}px;--dh:${door}px"></i>
    ${shop}${figs}</div>`;
}

// opts: { wing, depth, mode: "enter" | "deeper", reduced, title, sub, mega, scene: { hz, heroes } }. title is the big line
// ("Now entering the Sumgeon!" is split so "Sumgeon" gets the logo's colors), sub the line under it,
// mega a line under that on a mega boss's depth ("👑 Mega boss ahead!"). Mega depths wear a crown.
// legend: the Legend boss ends this run (DESIGN.md §14.2): the mega line is "🌟 A legend awaits!",
// in gold. golden: the ids of the strata whose Legend is beaten, whose layers get a gold edge.
// onReady() is called once, when it's time to start the run: at the end, or on a skip.
export function playDescent(opts, onReady) {
  if (active) return;
  const mode = opts.reduced ? "reduced" : opts.mode;
  const plan = descentPlan(opts.wing.id, opts.depth, mode);
  const el = document.createElement("div");
  el.className = "descent " + opts.wing.id + (mode === "reduced" ? " quick" : "");
  el.setAttribute("role", "presentation");
  document.body.append(el);
  const H = el.clientHeight || innerHeight;
  // The layers, in px. The surface is a screen tall (the start scene); each stratum passed is
  // most of a screen; the chosen one has its depths as a shaft, a row apart, and a screen below.
  const row = Math.round(Math.max(56, Math.min(96, H * 0.12))), skyH = Math.round(H * 0.72), passH = Math.round(H * 0.8);
  const topPad = Math.round(H * 0.42), rows = plan.to + 1, stopAt = 0.27; // the marker stops 27% down
  let html = "", y = 0;
  // The surface is the start scene's (opts.scene: its horizon and heroes), so the fall starts
  // from the frame the start screen showed.
  if (plan.surface) { const sc = opts.scene || {}; html += surfaceHTML({ W: el.clientWidth || innerWidth, H, hz: sc.hz || skyH, heroes: sc.heroes, stall: sc.stall }); y += H; }
  let markY = 0;
  plan.layers.forEach((n) => {
    const w = WINGS[n], last = n === plan.layers[plan.layers.length - 1], gold = (opts.golden || []).includes(w.id) ? " golden" : "";
    if (!last) { html += `<div class="d-layer ${w.id}${gold}" style="height:${passH}px"><b class="d-name">${esc(w.name)}</b></div>`; y += passH; return; }
    const marks = [];
    for (let k = 1; k <= rows; k++) marks.push(`<li class="${k < plan.to ? "done" : k === plan.to ? "here" : ""}${isMega(k) ? " mega" : ""}" style="top:${topPad + (k - 1) * row}px"><i></i><span>Depth ${k}${isMega(k) ? " 👑" : ""}</span></li>`);
    html += `<div class="d-layer ${w.id} chosen${gold}" style="height:${topPad + rows * row + H}px"><b class="d-name" style="top:${Math.round(topPad * 0.35)}px">${esc(w.name)}</b><i class="d-shaft" style="top:${topPad}px;height:${Math.round((rows - 0.4) * row)}px"></i><ol class="d-marks">${marks.join("")}</ol></div>`;
    markY = y + topPad; // depth 1's marker
  });
  const camAt = (depth) => (depth <= 0 ? 0 : Math.round(markY + (depth - 1) * row - H * stopAt));
  const from = camAt(plan.from), to = camAt(plan.to);
  const m = /^(.*?)(Sum)(geon)(.*)$/.exec(opts.title);
  const title = m ? `<span class="d-now">${esc(m[1].trim())}</span><span class="d-logo">${m[2]}<b>${m[3]}</b>${esc(m[4])}</span>` : `<span class="d-logo">${esc(opts.title)}</span>`;
  el.innerHTML = `<div class="d-stack" style="transform:translateY(${-from}px)">${html}</div><div class="d-streaks"></div>
    <div class="d-title" aria-live="polite"><h2>${title}</h2><p>${esc(opts.sub)}</p>${opts.mega ? `<p class="d-mega${opts.legend ? " legend" : ""}">${esc(opts.mega)}</p>` : ""}</div>`;
  const stack = el.querySelector(".d-stack");
  (document.activeElement && document.activeElement.blur && document.activeElement.blur()); // Enter on a focused button mustn't click it
  const timers = [], at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let anim = null, readied = false;
  const ready = () => { if (readied) return; readied = true; onReady(); };
  const cleanup = () => {
    timers.forEach(clearTimeout);
    if (anim) anim.cancel();
    ["pointerdown", "keydown", "click", "touchstart", "touchend", "pointerup", "contextmenu"].forEach((ev) => removeEventListener(ev, guard, true));
    el.remove(); active = null;
  };
  // Leaving: the run starts underneath, and the overlay fades away into the room. It keeps
  // catching input until it's gone.
  const leave = (fade) => {
    timers.forEach(clearTimeout); timers.length = 0;
    ready();
    el.classList.add("out"); el.style.transitionDuration = fade + "ms";
    setTimeout(cleanup, fade + 30);
  };
  // No input reaches the game while it plays. A tap or key skips (the voice keeps going).
  const guard = (e) => {
    if (e.type === "keydown" || e.type === "pointerdown" || e.type === "touchstart") {
      if (e.type === "keydown" && ["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      if (!readied) { sfx.stopFall(); if (anim) anim.pause(); leave(200); }
    }
    e.stopImmediatePropagation();
    if (e.cancelable && e.type !== "touchstart" && e.type !== "pointerdown") e.preventDefault();
  };
  ["pointerdown", "keydown", "click", "touchstart", "touchend", "pointerup", "contextmenu"].forEach((ev) => addEventListener(ev, guard, true));
  active = { el };

  if (mode === "reduced") {
    el.classList.add("titled", "landed");
    at(plan.ready, () => leave(plan.total - plan.ready));
    return;
  }
  at(plan.lead, () => {
    el.classList.add("falling");
    sfx.fall(plan.fall / 1000);
    if (stack.animate) anim = stack.animate([{ transform: `translateY(${-from}px)` }, { transform: `translateY(${-to}px)` }],
      { duration: plan.fall, easing: plan.surface ? "cubic-bezier(.5,0,.2,1)" : "cubic-bezier(.35,0,.2,1)", fill: "forwards" });
    else stack.style.transform = `translateY(${-to}px)`;
  });
  at(plan.titleAt, () => el.classList.add("titled"));
  at(plan.land, () => { el.classList.remove("falling"); el.classList.add("landed"); sfx.whoomp(); });
  at(plan.ready, () => leave(plan.total - plan.ready));
}

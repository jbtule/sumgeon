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
import { WINGS, descentPlan } from "./wings.js";
import * as sfx from "./sfx.js";

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let active = null;
export const descending = () => !!active;

// opts: { wing, depth, mode: "enter" | "deeper", reduced, title, sub }. title is the big line
// ("Now entering the Sumgeon!" is split so "Sumgeon" gets the logo's colors), sub the line under it.
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
  // The layers, in px. The surface is a screen tall (sky over the grass); each stratum passed is
  // most of a screen; the chosen one has its depths as a shaft, a row apart, and a screen below.
  const row = Math.round(Math.max(56, Math.min(96, H * 0.12))), skyH = Math.round(H * 0.72), grassH = Math.round(H * 0.28), passH = Math.round(H * 0.8);
  const topPad = Math.round(H * 0.42), rows = plan.to + 1, stopAt = 0.27; // the marker stops 27% down
  let html = "", y = 0;
  if (plan.surface) { html += `<div class="d-surface" style="height:${skyH + grassH}px"><div class="d-sky" style="height:${skyH}px"><i class="d-door"></i></div><div class="d-grass" style="height:${grassH}px"></div></div>`; y += skyH + grassH; }
  let markY = 0;
  plan.layers.forEach((n) => {
    const w = WINGS[n], last = n === plan.layers[plan.layers.length - 1];
    if (!last) { html += `<div class="d-layer ${w.id}" style="height:${passH}px"><b class="d-name">${esc(w.name)}</b></div>`; y += passH; return; }
    const marks = [];
    for (let k = 1; k <= rows; k++) marks.push(`<li class="${k < plan.to ? "done" : k === plan.to ? "here" : ""}" style="top:${topPad + (k - 1) * row}px"><i></i><span>Depth ${k}</span></li>`);
    html += `<div class="d-layer ${w.id} chosen" style="height:${topPad + rows * row + H}px"><b class="d-name" style="top:${Math.round(topPad * 0.35)}px">${esc(w.name)}</b><i class="d-shaft" style="top:${topPad}px;height:${Math.round((rows - 0.4) * row)}px"></i><ol class="d-marks">${marks.join("")}</ol></div>`;
    markY = y + topPad; // depth 1's marker
  });
  const camAt = (depth) => (depth <= 0 ? 0 : Math.round(markY + (depth - 1) * row - H * stopAt));
  const from = camAt(plan.from), to = camAt(plan.to);
  const m = /^(.*?)(Sum)(geon)(.*)$/.exec(opts.title);
  const title = m ? `<span class="d-now">${esc(m[1].trim())}</span><span class="d-logo">${m[2]}<b>${m[3]}</b>${esc(m[4])}</span>` : `<span class="d-logo">${esc(opts.title)}</span>`;
  el.innerHTML = `<div class="d-stack" style="transform:translateY(${-from}px)">${html}</div><div class="d-streaks"></div>
    <div class="d-title" aria-live="polite"><h2>${title}</h2><p>${esc(opts.sub)}</p></div>`;
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

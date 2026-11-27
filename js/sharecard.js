// The achievement share card (DESIGN.md §14.1), patterned on sound-box-crosswords' sharecard.js:
// the achievement drawn to a canvas on the device (there's no server) and handed to the share
// sheet as a PNG, or downloaded where files can't be shared. It shows the game's name, the icon,
// the title, what it took, the date and the monster or hero involved. Never the player's name.
// Uses the DOM (a canvas, the page's fonts and walls); app.js calls it from the 🏆 sheet.

const W = 1080, H = 1350; // 4:5 portrait, a good size for Messages and Photos
const SITE = "tools.tuley.name/sumgeon";
const GOLD = "#ffc93c", CORAL = "#ff5a4e", CHALK = "#f3efe4", MUTED = "#a9bec1", DARK = "#0c171c";
const DISPLAY = '"Bungee", system-ui, sans-serif', BODY = '"Nunito", system-ui, sans-serif';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// Largest font size (down to `min`) at which `text` fits in `maxW`.
function fit(ctx, text, font, size, min, maxW) {
  for (; size > min; size -= 4) {
    ctx.font = font.replace("{s}", size);
    if (ctx.measureText(text).width <= maxW) break;
  }
  return size;
}
// Words broken into lines that fit maxW (at most `max` lines; the last gets "…" if cut).
function wrap(ctx, text, maxW, max) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width <= maxW || !line) line = t;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > max) { lines.length = max; lines[max - 1] += "…"; }
  // Two lines, balanced, so the second isn't one lonely word.
  if (lines.length === 2 && max === 2 && !lines[1].endsWith("…")) {
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" "), b = words.slice(i).join(" "), w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (w <= maxW && (!best || w < best.w)) best = { w, lines: [a, b] };
    }
    if (best) return best.lines;
  }
  return lines;
}
function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed"));
    img.src = src;
  });
}
// The game's inline SVG art (monsters and heroes: shapes only, no text or CSS) as an image.
function svgImage(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1], [, , vw, vh] = (vb || "0 0 220 220").split(/\s+/).map(Number);
  // Through the HTML parser and back out as XML: the inline art is written for HTML, which forgives
  // what an SVG image doesn't (an attribute given twice).
  const t = document.createElement("template");
  t.innerHTML = svg.trim();
  const el = t.content.firstElementChild;
  el.setAttribute("width", vw * 2); el.setAttribute("height", vh * 2);
  const s = new XMLSerializer().serializeToString(el);
  return load("data:image/svg+xml;charset=utf-8," + encodeURIComponent(s)).then((img) => ({ img, ratio: vw / vh }));
}
// A stratum's wall (styles.css --wall-<id>, an inline SVG tile) as a canvas pattern, or null.
async function wallPattern(ctx, id) {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--wall-" + id);
  const m = v.trim().match(/^url\(\s*(["']?)(data:[\s\S]*)\1\s*\)$/), url = m && m[2];
  if (!url) return null;
  const img = await load(url), p = ctx.createPattern(img, "repeat");
  if (p && p.setTransform && typeof DOMMatrix === "function") p.setTransform(new DOMMatrix().scale(2.5));
  return p;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

// a = { icon, title, detail, secret }; when = the time it was earned; figures = the game's SVG art
// of the monsters or heroes involved (up to 4); wall = a stratum's id for its wall behind (else a
// gold-on-purple ground, as the grand ones' card). Resolves to a PNG Blob.
export async function renderCard(a, when, figures, wall) {
  // Draw with the game's own fonts (self-hosted in fonts/), not a fallback.
  try { await Promise.all([document.fonts.load(`400 80px ${DISPLAY}`), document.fonts.load(`900 40px ${BODY}`), document.fonts.load(`700 40px ${BODY}`)]); } catch (e) {}
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  // The ground: the stratum's wall, darkened, with a gold glow in the middle.
  let pat = null;
  try { pat = wall ? await wallPattern(ctx, wall) : null; } catch (e) {}
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "rgba(12,23,28,.62)"; ctx.fillRect(0, 0, W, H); }
  else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#3a2a5a"); g.addColorStop(1, "#12242b"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const glow = ctx.createRadialGradient(W / 2, 560, 40, W / 2, 560, 620);
  glow.addColorStop(0, "rgba(255,216,77,.30)"); glow.addColorStop(1, "rgba(255,216,77,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // The card's gold frame.
  const m = 48;
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 48);
  ctx.lineWidth = 10; ctx.strokeStyle = DARK; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = GOLD; ctx.stroke();

  // "Sumgeon", as the logo: Sum in gold, geon in coral, with a dark drop.
  ctx.font = `400 84px ${DISPLAY}`;
  const sum = ctx.measureText("Sum").width, geon = ctx.measureText("geon").width, x0 = W / 2 - (sum + geon) / 2;
  ctx.textAlign = "left";
  for (const [t, x, col] of [["Sum", x0, GOLD], ["geon", x0 + sum, CORAL]]) { ctx.fillStyle = DARK; ctx.fillText(t, x, 160 + 6); ctx.fillStyle = col; ctx.fillText(t, x, 160); }
  ctx.textAlign = "center";

  ctx.fillStyle = CORAL;
  ctx.font = `400 40px ${DISPLAY}`;
  ctx.fillText(a.secret ? "Secret achievement!" : "Achievement!", W / 2, 250);

  // The icon.
  ctx.font = `${fit(ctx, a.icon, `{s}px ${EMOJI}`, 190, 90, W - 300)}px ${EMOJI}`;
  ctx.fillText(a.icon, W / 2, 400);

  // The title and what it took.
  const inner = W - 2 * m - 110;
  fit(ctx, a.title, `400 {s}px ${DISPLAY}`, 96, 44, inner);
  ctx.fillStyle = DARK; ctx.fillText(a.title, W / 2, 568 + 6);
  ctx.fillStyle = GOLD; ctx.fillText(a.title, W / 2, 568);
  ctx.fillStyle = CHALK;
  ctx.font = `800 44px ${BODY}`;
  const lines = wrap(ctx, a.detail, inner, 2);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 660 + i * 56));

  // The monsters or heroes involved, standing on a shadow.
  const imgs = [];
  for (const f of (figures || []).slice(0, 4)) { try { imgs.push(await svgImage(f)); } catch (e) {} }
  if (imgs.length) {
    const bottom = 1130, h = imgs.length > 2 ? 230 : 330, gap = 30;
    const ws = imgs.map((x) => h * x.ratio), total = ws.reduce((s, w) => s + w, 0) + gap * (imgs.length - 1);
    const scale = Math.min(1, (W - 2 * m - 80) / total);
    let x = W / 2 - total * scale / 2;
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(W / 2, bottom - 8, total * scale / 2 + 20, 26, 0, 0, Math.PI * 2); ctx.fill();
    imgs.forEach((x2, i) => {
      const w = ws[i] * scale, hh = h * scale;
      ctx.drawImage(x2.img, x, bottom - hh, w, hh);
      x += w + gap * scale;
    });
  }

  // When, and where to play.
  ctx.fillStyle = CHALK;
  ctx.font = `700 40px ${BODY}`;
  ctx.fillText(new Date(when).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }), W / 2, 1192);
  ctx.fillStyle = MUTED;
  ctx.font = `700 34px ${BODY}`;
  ctx.fillText(SITE, W / 2, H - m - 54);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

// Opens the share sheet with the PNG, or downloads it where sharing files isn't supported. Must be
// called straight from a tap (iOS), so the blob is rendered beforehand (app.js, as the card opens).
export function shareCard(blob, title) {
  const name = "sumgeon-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    return navigator.share({ files: [file], title, text: `${title}, earned in Sumgeon!` }).then(() => true, () => false);
  }
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return Promise.resolve(true);
}

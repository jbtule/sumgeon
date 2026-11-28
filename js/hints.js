import { coinsSvg, coinFact, findFact, coinOf, pileOf, COINS } from "./coins.js";
import { unitName, fractionFact, roundFact, rectFact, fracCompareFact } from "./third.js";
import { hiddenFact } from "./missing.js";
import { moreFact } from "./balance.js";
import { threeFact, tenOf, tenPairOf, sumFact } from "./three.js";
import { arrayFact } from "./arrays.js";
import { clockSvg, clockFact, clockFactHint, elapsedSvg, inHour } from "./clock.js";
import { patternSvg, patternFact, patternFactHint, oddEvenSvg, oddEvenFact } from "./patterns.js";
import { tfSvg, tfHint, tfFactOf } from "./truefalse.js";
import { lineSvg, lineHint, lineFactOf } from "./numberline.js";
import { pvSvg, pvHint, pvFactOf } from "./placevalue.js";
import { dollarSvg, dollarHint, dollarFactOf } from "./dollars.js";
import { countSvg, countHint, drawHintSvg, drawHint, shapeFactOf } from "./shapes.js";
import { flashSvg, flashHint, flashFactOf } from "./flash.js";
import { fourthHint, isFourthHint } from "./hints4.js";
import { chartSvg, chartHint, chartFactOf } from "./charts.js";
import { lengthSvg, lengthHint, lengthGameFactOf } from "./length.js";

// Hints (DESIGN.md §5.3): the models classrooms use now, with the classroom's words, and a line
// for grown-ups who learned it another way. No DOM: returns { model, say, grownups } where model
// is an SVG string, so the tests run in Node.
//
// worked: false shows the strategy without the answer (a hint before answering); true finishes it
// with the answer (the worked example after a miss). Hints never just show the answer.

const C = { a: "var(--gold)", b: "var(--coral)", empty: "var(--hint-empty)", line: "var(--hint-line)", ink: "var(--ink)", muted: "var(--muted)" };
const R = 7, GAP = 18; // dot radius and spacing

function dot(x, y, fill, crossed) {
  let s = `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}"/>`;
  if (crossed) s += `<path d="M${x - R} ${y - R}L${x + R} ${y + R}M${x + R} ${y - R}L${x - R} ${y + R}" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  return s;
}
// Drawn 1.5× so the dots are easy to count on a tablet; the CSS shrinks a wide one to fit.
const SCALE = 1.5;
function svg(w, h, body, label) {
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * SCALE}" height="${h * SCALE}" role="img" aria-label="${label}">${body}</svg>`;
}
// A ten-frame (2 rows of 5) at (x0, y0) holding colors[i] in cell i (empty when missing).
function tenFrame(x0, y0, colors, crossedFrom) {
  let s = `<rect x="${x0}" y="${y0}" width="${5 * GAP + 6}" height="${2 * GAP + 6}" rx="6" fill="none" stroke="${C.line}" stroke-width="2"/>`;
  for (let i = 0; i < 10; i++) {
    const x = x0 + 3 + GAP / 2 + (i % 5) * GAP, y = y0 + 3 + GAP / 2 + Math.floor(i / 5) * GAP;
    s += colors[i] ? dot(x, y, colors[i], crossedFrom != null && i >= crossedFrom) : `<circle cx="${x}" cy="${y}" r="${R - 1}" fill="none" stroke="${C.empty}" stroke-width="1.5"/>`;
  }
  return s;
}
const FRAME_W = 5 * GAP + 6, FRAME_H = 2 * GAP + 6;
function fill(n, color) { return Array.from({ length: n }, () => color); }

// Rows × cols of dots. opt.split: a gap after that many columns (break apart); opt.rowSplit: a
// gap after that many rows (one more group); opt.groups: "rows" or "cols" rings each group (÷);
// opt.label: the aria label.
function array(rows, cols, opt) {
  opt = opt || {};
  const { split, rowSplit, groups } = opt, gx = split ? 10 : 0, gy = rowSplit ? 10 : 0;
  const w = cols * 14 + gx + 4, h = rows * 14 + gy + 4;
  const cx = (c) => 9 + c * 14 + (split && c >= split ? gx : 0), cy = (r) => 9 + r * 14 + (rowSplit && r >= rowSplit ? gy : 0);
  let s = "";
  if (groups === "rows") for (let r = 0; r < rows; r++) s += `<rect x="2" y="${cy(r) - 6.5}" width="${w - 4}" height="13" rx="6.5" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
  if (groups === "cols") for (let c = 0; c < cols; c++) s += `<rect x="${cx(c) - 6.5}" y="2" width="13" height="${h - 4}" rx="6.5" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const other = (split && c >= split) || (rowSplit && r >= rowSplit);
    s += `<circle cx="${cx(c)}" cy="${cy(r)}" r="5" fill="${other ? C.b : C.a}"/>`;
  }
  return svg(w, h, s, opt.label || `${rows} ${rows === 1 ? "row" : "rows"} of ${cols}`);
}
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
// Text in a drawing.
function txt(x, y, t, size, color, anchor) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor || "middle"}" fill="${color || C.ink}" font-size="${size || 14}" font-weight="900">${t}</text>`;
}
// One group holding all n (× 1 and ÷ 1).
function oneGroup(n) {
  let s = `<rect x="2" y="2" width="${n * 14 + 8}" height="22" rx="11" fill="none" stroke="${C.line}" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) s += `<circle cx="${13 + i * 14}" cy="13" r="5" fill="${C.a}"/>`;
  return svg(n * 14 + 12, 26, s, `1 group of ${n}`);
}
// × 5: groups of 5 side by side, counted by 5s under them (the last count is "?" before answering).
function fives(n, worked) {
  let s = "";
  for (let g = 0; g < n; g++) {
    const cx = 12 + g * 22;
    s += `<rect x="${cx - 8}" y="2" width="16" height="56" rx="8" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
    for (let k = 0; k < 5; k++) s += `<circle cx="${cx}" cy="${10 + k * 10}" r="4.2" fill="${g % 2 ? C.b : C.a}"/>`;
    s += txt(cx, 74, g === n - 1 && !worked ? "?" : (g + 1) * 5, 12);
  }
  return svg(n * 22 + 2, 80, s, `${n} groups of 5`);
}
// The area model, wide and short: a rows × 10 block next to a small rows × extra block (× 11, × 12).
function areaSplit(rows, extra) {
  const U = 11, A = 10 * U, B = extra * U, H = 40, x0 = 24, y0 = 18, bx = x0 + A + 4;
  let s = `<rect x="${x0}" y="${y0}" width="${A}" height="${H}" rx="2" fill="${C.a}" fill-opacity=".3" stroke="${C.a}" stroke-width="2.5"/>`;
  s += `<rect x="${bx}" y="${y0}" width="${B}" height="${H}" rx="2" fill="${C.b}" fill-opacity=".3" stroke="${C.b}" stroke-width="2.5"/>`;
  for (let i = 1; i < 10; i++) s += `<line x1="${x0 + i * U}" y1="${y0}" x2="${x0 + i * U}" y2="${y0 + H}" stroke="${C.a}" stroke-opacity=".45" stroke-width="1"/>`;
  for (let i = 1; i < extra; i++) s += `<line x1="${bx + i * U}" y1="${y0}" x2="${bx + i * U}" y2="${y0 + H}" stroke="${C.b}" stroke-opacity=".45" stroke-width="1"/>`;
  s += txt(x0 - 10, y0 + H / 2 + 5, rows) + txt(x0 + A / 2, y0 - 5, 10, 13, C.a) + txt(bx + B / 2, y0 - 5, extra, 13, C.b);
  s += txt(x0 + A / 2, y0 + H + 17, `${rows} × 10`, 13, C.a) + txt(bx + B / 2 + 6, y0 + H + 17, `${rows} × ${extra}`, 13, C.b);
  return svg(bx + B + 30, y0 + H + 22, s, `${rows} × 10 and ${rows} × ${extra}`);
}
// Division as a missing side of the area model: y by ? makes x.
function areaDiv(x, y, ans, worked) {
  const W = 150, H = 44, x0 = 28, y0 = 20;
  let s = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="2" fill="${C.a}" fill-opacity=".3" stroke="${C.a}" stroke-width="2.5"/>`;
  s += txt(x0 - 12, y0 + H / 2 + 5, y) + txt(x0 + W / 2, y0 - 6, worked ? ans : "?", 14, C.b) + txt(x0 + W / 2, y0 + H / 2 + 6, x, 17);
  return svg(x0 + W + 8, y0 + H + 6, s, `${y} by what makes ${x}`);
}

// A double: two equal rows of n, with a gap after 5, so the two 5s make 10.
function doubleRows(n) {
  let s = "";
  for (let r = 0; r < 2; r++) for (let c = 0; c < n; c++) s += `<circle cx="${9 + c * 14 + (c >= 5 ? 8 : 0)}" cy="${9 + r * 14}" r="5" fill="${r ? C.b : C.a}"/>`;
  return svg(n * 14 + (n > 5 ? 8 : 0) + 4, 32, s, `two rows of ${n}`);
}

// A double (two rows of n) and one more dot.
function nearDouble(n) {
  let s = "";
  for (let r = 0; r < 2; r++) for (let c = 0; c < n; c++) s += `<circle cx="${9 + c * 14}" cy="${9 + r * 14}" r="5" fill="${C.a}"/>`;
  s += `<circle cx="${9 + n * 14}" cy="23" r="5" fill="${C.b}"/>`;
  return svg((n + 1) * 14 + 4, 32, s, `${n} and ${n}, and 1 more`);
}

// An open number line from a to b, hopping to `via` first: counting up through 10 when b > a,
// or counting back to 10 (or to a ten) when b < a. Before answering (worked false) nothing shows
// the answer: counting back, the last stop is "?"; counting up in one hop, the hop is "+?".
function hops(a, b, via, worked) {
  const back = b < a, lo = Math.min(a, b), hi = Math.max(a, b);
  const stops = [a, ...[].concat(via || []).filter((v) => v > lo && v < hi), b];
  // Laid out smallest to biggest; hops are spaced by size, but a short hop still gets room for its labels.
  const line = back ? stops.slice().reverse() : stops;
  const W = 260, min = (hi - lo) / 5, gaps = line.slice(1).map((n, i) => Math.max(n - line[i], line.length > 2 ? min : 0));
  const total = gaps.reduce((t, g) => t + g, 0), pos = { [line[0]]: 14 };
  line.slice(1).forEach((n, i) => { pos[n] = pos[line[i]] + gaps[i] / total * (W - 28); });
  const x = (n) => pos[n];
  let s = `<line x1="8" y1="44" x2="${W - 8}" y2="44" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
  stops.forEach((n, i) => {
    const label = back && i === stops.length - 1 && !worked ? "?" : n;
    s += `<line x1="${x(n)}" y1="38" x2="${x(n)}" y2="50" stroke="${C.ink}" stroke-width="2.5"/><text x="${x(n)}" y="66" text-anchor="middle" fill="${label === "?" ? C.a : C.ink}" font-size="14" font-weight="800">${label}</text>`;
    if (i) {
      const p = stops[i - 1], mid = (x(p) + x(n)) / 2;
      const col = i % 2 ? C.a : C.b;
      // An arrowhead where the hop lands, so counting back reads right to left.
      const dir = n > p ? -1 : 1, size = !back && stops.length === 2 && !worked ? "?" : Math.abs(n - p);
      s += `<path d="M${x(p)} 38 Q${mid} 6 ${x(n)} 38" fill="none" stroke="${col}" stroke-width="3"/><path d="M${x(n) + dir * 7} 28 L${x(n)} 38 L${x(n) + dir * 9} 35" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="${mid}" y="16" text-anchor="middle" fill="${col}" font-size="13" font-weight="900">${back ? "−" : "+"}${size}</text>`;
    }
  });
  return svg(W, 72, s, back ? `count back from ${a}` : `count up from ${a} to ${b}`);
}

// Coins (DESIGN.md §5.3), with the K guide's words for each coin ("A dime is small and silver").
// Find the coin: that coin, heads and tails, then the pile with it ringed. One coin: the four
// coins with their values (on the side asked), then that coin both ways. A count: each coin's
// value under it, then count on from the biggest.
const both = (k) => [{ k, tails: false }, { k, tails: true }];
function coinHint(f, worked) {
  const end = worked ? f.ans : "?";
  const grownups = "Coins: kindergarten names the penny, nickel, dime and quarter from either side and learns what each is worth; 1st grade counts them up, starting with the biggest coin and skip counting by 10s and 5s.";
  if (f.find) {
    const t = coinOf(f.find);
    if (!worked) return { model: coinsSvg(both(f.find), { names: true }), say: `A ${t.name} is ${t.look}. Look for both sides! ${t.names[0].toUpperCase() + t.names.slice(1)} = ?`, grownups };
    return { model: coinsSvg(f.pile || pileOf(f), { ring: f.find }), say: `A ${t.name} is ${t.look}. ${t.names[0].toUpperCase() + t.names.slice(1)} = ${f.ans}`, grownups };
  }
  const vals = f.q.split(" + ").map(Number);
  if (vals.length === 1) {
    const t = COINS.find((c) => f.coins[c.k]);
    if (!worked) return { model: coinsSvg(COINS.map((c) => ({ k: c.k, tails: !!f.tails })), { labels: true }), say: "Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢. This coin = ?", grownups };
    return { model: coinsSvg(both(t.k), { labels: true }), say: `A ${t.name} is ${t.look}. It's worth ${t.v}¢. This coin = ${t.v}`, grownups };
  }
  // Each coin's value under it, and the running count under that (the last one "?" before answering).
  const pile = f.pile || pileOf(f);
  let run = 0, cx = 4, totals = "";
  pile.forEach((pc, i) => {
    const t = coinOf(pc.k);
    run += t.v;
    totals += `<text x="${cx + t.r}" y="88" text-anchor="middle" fill="var(--gold)" font-family="Nunito,sans-serif" font-size="13" font-weight="900">${i === pile.length - 1 && !worked ? "?" : run}</text>`;
    cx += t.r * 2 + 4;
  });
  const model = coinsSvg(pile, { labels: true })
    .replace(/viewBox="0 0 (\S+) 72" width="(\d+)" height="\d+"/, (m, w, pw) => `viewBox="0 0 ${w} 94" width="${pw}" height="${Math.round(94 * 1.3)}"`)
    .replace("</svg>", totals + "</svg>");
  const say = vals.every((v) => v === 1) ? `Count the pennies, 1 cent each. Total = ${end}` : `Count on from the biggest coin. Total = ${end}`;
  return { model, say, grownups };
}

// Base-ten blocks: a rod for each ten and a little square for each one. crossFrom: rods from this
// index on are crossed out (taking away tens), and ones from crossOnes on. Returns { s, w }.
function blocks(n, x0, color, crossFrom, crossOnes) {
  let s = "", x = x0;
  const tens = Math.floor(n / 10), ones = n % 10;
  for (let i = 0; i < tens; i++, x += 11) {
    s += `<rect x="${x}" y="4" width="8" height="50" rx="1.5" fill="${color}"/>`;
    for (let k = 1; k < 10; k++) s += `<line x1="${x}" y1="${4 + k * 5}" x2="${x + 8}" y2="${4 + k * 5}" stroke="var(--dark)" stroke-width="1"/>`;
    if (crossFrom != null && i >= crossFrom) s += `<path d="M${x} 8L${x + 8} 50M${x + 8} 8L${x} 50" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (ones) x += 2;
  for (let i = 0; i < ones; i++) {
    const ox = x + (i % 2) * 10, oy = 44 - Math.floor(i / 2) * 10;
    s += `<rect x="${ox}" y="${oy}" width="8" height="8" rx="1.5" fill="${color}"/>`;
    if (crossOnes != null && i >= crossOnes) s += `<path d="M${ox - 1} ${oy - 1}L${ox + 9} ${oy + 9}M${ox + 9} ${oy - 1}L${ox - 1} ${oy + 9}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (ones) x += ones > 1 ? 20 : 10;
  return { s, w: x - x0 };
}
// Two-digit + and − (2nd grade): tens and ones for adding. For subtracting: take away the tens
// and ones when the ones are enough (69 − 26), back to a ten when taking a one-digit number
// crosses it (52 − 7), and counting up when both numbers have tens and it crosses one (52 − 28).
function twoDigitHint(f, worked) {
  const { op, x, y, ans } = f, end = worked ? ans : "?";
  const tens = (n) => n - (n % 10), ones = (n) => n % 10, T = (n) => n / 10 + (n === 10 ? " ten" : " tens");
  if (op === "+") {
    const a = blocks(x, 4, C.a), b = blocks(y, 4 + a.w + 14, C.b);
    const model = svg(a.w + b.w + 22, 58, a.s + b.s, `${x} and ${y} in tens and ones`);
    const grownups = "Tens and ones (place value): kids add the tens, add the ones, then put them together. Ten ones make a new ten, which is all regrouping (carrying) is.";
    if (!ones(x) && !ones(y)) return { model, say: `${T(x)} + ${T(y)}. ${x} + ${y} = ${end}`, grownups };
    const t = tens(x) + tens(y), o = ones(x) + ones(y);
    // Only one number has ones: 30 + 5 is 3 tens and 5 ones, and 40 + 23 adds just the tens.
    if (!ones(x) || !ones(y)) {
      const tensOnly = !ones(x) ? x : y, other = tensOnly === x ? y : x;
      if (!tens(other)) return { model, say: `${T(tensOnly)} and ${other} ones. ${tensOnly} + ${other} = ${end}`, grownups };
      return { model, say: `Add the tens: ${tens(x)} + ${tens(y)} = ${t}. ${t} + ${o} = ${end}`, grownups };
    }
    if (!tens(x) || !tens(y)) return { model, say: `Add the ones: ${ones(x)} + ${ones(y)} = ${o}. ${t} + ${o} = ${end}`, grownups };
    return { model, say: `Tens and ones: ${tens(x)} + ${tens(y)} = ${t}, ${ones(x)} + ${ones(y)} = ${o}. ${t} + ${o} = ${end}`, grownups };
  }
  if (!ones(x) && !ones(y)) {
    const a = blocks(x, 4, C.a, (x - y) / 10);
    return { model: svg(a.w + 8, 58, a.s, `${x / 10} tens, take away ${y / 10}`),
      say: `${T(x)} take away ${T(y)}. ${x} − ${y} = ${end}`,
      grownups: "Taking away tens: 70 − 30 is 7 tens take away 3 tens, so it's just 7 − 3 with a zero." };
  }
  // The ones are enough: cross out the tens and ones taken away, and the blocks show what's left.
  if (ones(x) >= ones(y)) {
    const a = blocks(x, 4, C.a, (tens(x) - tens(y)) / 10, ones(x) - ones(y));
    const model = svg(a.w + 8, 58, a.s, `${x} in tens and ones, take away ${y}`);
    const grownups = "Take away tens and ones: when there are enough ones, kids cross out the tens and ones being taken away, so 69 − 26 is 60 − 20 = 40 and 9 − 6 = 3.";
    const what = [tens(y) && T(tens(y)), ones(y) && plural(ones(y), "one")].filter(Boolean).join(" and ");
    return { model, say: `Cross out ${what}. ${x} − ${y} = ${end}`, grownups };
  }
  // A one-digit number that crosses a ten: back to the ten, then the rest (52 − 7: 52 − 2 = 50, then 5 more).
  if (y < 10) {
    const grownups = "Back to a ten: taking a small number away, kids count back on an open number line to the ten first, then the rest. 52 − 7 is 52 − 2 = 50, then 50 − 5.";
    if (!ones(x)) {
      // 30 − 2: 30 is 20 and a ten, the ten broken into ones and 2 of them crossed out.
      const a = blocks(x - 10, 4, C.a), x0 = 4 + a.w + 8;
      let s = a.s + `<rect x="${x0 - 3}" y="1" width="26" height="56" rx="4" fill="none" stroke="${C.b}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      for (let i = 0; i < 10; i++) {
        const ox = x0 + (i % 2) * 10, oy = 44 - Math.floor(i / 2) * 10;
        s += `<rect x="${ox}" y="${oy}" width="8" height="8" rx="1.5" fill="${C.b}"/>`;
        if (i >= 10 - y) s += `<path d="M${ox - 1} ${oy - 1}L${ox + 9} ${oy + 9}M${ox + 9} ${oy - 1}L${ox - 1} ${oy + 9}" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
      }
      return { model: svg(x0 + 28, 58, s, `${x - 10} and a ten in ones, take away ${y}`),
        say: `${x} is ${x - 10} and 10. Take ${y} from the 10: 10 − ${y} = ${10 - y}. ${x - 10} + ${10 - y} = ${end}`, grownups };
    }
    const rest = y - ones(x);
    return { model: hops(x, ans, tens(x), worked), say: `Back to ${tens(x)}, then back ${rest} more: ${x} − ${ones(x)} = ${tens(x)}. ${tens(x)} − ${rest} = ${end}`, grownups };
  }
  // Count up from y: to the next ten, then by tens, then the rest.
  const up = Math.ceil(y / 10) * 10, down = tens(x), stops = [y, up, down, x].filter((v, i, a) => a.indexOf(v) === i && v >= y && v <= x);
  const jumps = stops.slice(1).map((v, i) => v - stops[i]);
  return { model: hops(y, x, stops.slice(1, -1), worked),
    say: `Think addition: count up from ${y} to ${x}. ${jumps.length > 1 ? jumps.join(" + ") : x + " − " + y} = ${end}`,
    grownups: "Think addition on an open number line: when it crosses a ten (52 − 28), kids count up from the smaller number, hopping to the next ten, then by tens, then the rest." };
}

// The Balance Hall (K–2nd). Comparing: line the dots up (to 10, and sums), or tens then ones (to
// 100). Balancing: both sides weigh the same, so work out the known side, then what's missing.
function dotRow(y, groups, x0) {
  let s = "", i = 0;
  groups.forEach(([n, color]) => { for (let k = 0; k < n; k++, i++) s += `<circle cx="${(x0 || 12) + i * 17}" cy="${y}" r="6.5" fill="${color}"/>`; });
  return s;
}
// A gold ring around the bigger number's row: the side the mouth opens to. (Not a drawn mouth: a
// mouth by the bottom row is a ">" on its side, and a kid copies the shape.)
function bigger(x0, x1, y) {
  return `<rect x="${x0}" y="${y - 10}" width="${x1 - x0}" height="20" rx="10" fill="none" stroke="${C.a}" stroke-width="2.5"/>`;
}
// The worked comparison under the drawing: "3 + 4 < 8", the symbol in gold.
function compareLine(x, y, f) {
  return `<text x="${x}" y="${y}" text-anchor="middle" fill="${C.ink}" font-size="18" font-weight="900">${f.l} <tspan fill="${C.a}">${f.sym === "<" ? "&lt;" : f.sym === ">" ? "&gt;" : "="}</tspan> ${f.r}</text>`;
}
const sideValue = (side) => side.split(" + ").reduce((t, n) => t + Number(n), 0);
function balanceHint(f, worked) {
  if (f.op === "○") {
    const lv = sideValue(f.l), rv = sideValue(f.r), end = worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r;
    const grownups = "Comparing: kids line up the dots (or compare tens, then ones) to see which is more. The open side of < and > faces the bigger number, like Chompers' mouth.";
    const rule = "The mouth opens to the bigger number.";
    if (Math.max(lv, rv) <= 10) {
      // Each side's row, labeled, and the longer row ringed in gold.
      const parts = f.l.split(" + ").map(Number), left = parts.length > 1 ? [[parts[0], C.a], [parts[1], C.b]] : [[lv, C.a]];
      const X0 = 56, end_ = (n) => X0 + (n - 1) * 17 + 10;
      let s = txt(X0 - 14, 17, f.l, 14, C.ink, "end") + dotRow(12, left, X0) + txt(X0 - 14, 39, f.r, 14, C.ink, "end") + dotRow(34, [[rv, C.ink]], X0);
      if (lv !== rv) s += lv > rv ? bigger(4, end_(lv), 12) : bigger(4, end_(rv), 34);
      if (worked) s += compareLine(130, 70, f);
      const model = svg(X0 + 10 * 17 + 18, worked ? 78 : 46, s, `${plural(lv, "dot")} and ${plural(rv, "dot")}`);
      const sum = parts.length > 1 ? `${f.l} is ${lv}. ` : "";
      return { model, say: `${sum}Line them up. ${rule} ${end}`, grownups };
    }
    const a = blocks(lv, 4, C.a), b = blocks(rv, 4 + a.w + 30, C.b);
    let s = a.s + b.s + txt(4 + a.w / 2, 74, lv) + txt(4 + a.w + 30 + b.w / 2, 74, rv);
    if (lv !== rv) s += `<rect x="${lv > rv ? 1 : a.w + 31}" y="1" width="${(lv > rv ? a.w : b.w) + 6}" height="78" rx="6" fill="none" stroke="${C.a}" stroke-width="2.5"/>`;
    if (worked) s += txt(4 + a.w + 14, 40, f.sym === "<" ? "&lt;" : f.sym === ">" ? "&gt;" : "=", 26, C.a);
    return { model: svg(a.w + b.w + 38, 80, s, `${lv} and ${rv} in tens and ones`),
      say: `Compare the tens first. ${rule} ${end}`, grownups };
  }
  // Balance: the side without the □ is the total.
  const known = f.l.includes("□") ? f.r : f.l, open = f.l.includes("□") ? f.l : f.r;
  const total = sideValue(known), other = sideValue(open.replace("□", "0")), end = worked ? f.ans : "?";
  const W = 260, beam = `<path d="M130 70 L118 92 H142 Z" fill="${C.muted}"/><line x1="20" y1="70" x2="240" y2="70" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
  const pan = (cx, groups, box) => {
    // Each addend starts a row of its own (rows of 5, stacked up from the pan), so 3 + 4 reads as 3 and 4.
    let s = `<path d="M${cx - 50} 64 Q${cx - 3} 78 ${cx + 44} 64" fill="none" stroke="${C.muted}" stroke-width="3" stroke-linecap="round"/>`, row = 0, last = 0;
    groups.forEach(([n, color]) => {
      for (let k = 0; k < n; k++) s += `<circle cx="${cx - 40 + (k % 5) * 16}" cy="${56 - (row + Math.floor(k / 5)) * 15}" r="6" fill="${color}"/>`;
      if (n) { last = n % 5 || 5; row += Math.ceil(n / 5); }
    });
    if (box) {
      const r = !row || last === 5 ? row : row - 1, c = !row || last === 5 ? 0 : last;
      s += `<rect x="${cx - 40 + c * 16 - 7}" y="${49 - r * 15}" width="14" height="14" rx="3" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="3 2"/>`;
    }
    return s;
  };
  const kParts = known.split(" + ").map(Number), groups = kParts.length > 1 ? [[kParts[0], C.a], [kParts[1], C.b]] : [[total, C.a]];
  const model = svg(W, 96, beam + pan(f.l.includes("□") ? 195 : 65, groups) + pan(f.l.includes("□") ? 65 : 195, [[other, C.ink]], true), `a balance: ${f.q}`);
  const first = kParts.length > 1 ? `${known} = ${total}, so ` : "";
  return { model, say: `Both sides are the same. ${first}${open} = ${total}. ${total} − ${other} = ${end}`,
    grownups: "The equal sign means both sides are the same amount, not \"the answer comes next\". Kids work out the side they know, then find what makes the other side match." };
}

// Which is more (K): line the dots up, and the longer row is more.
function moreHint(f, worked) {
  const model = svg(12 + 10 * 17, 44, dotRow(12, [[f.x, C.a]]) + dotRow(32, [[f.y, C.b]]), `${plural(f.x, "dot")} and ${plural(f.y, "dot")}`);
  return { model, say: `Line them up: the longer row is more. More = ${worked ? f.ans : "?"}`,
    grownups: "Which is more: kids line up two groups and see which row is longer, before they compare with the < and > signs in 1st grade." };
}

// A number bond: the whole on top, its two parts below, the hidden part a glowing ring with "?".
// Each part's dots sit under it (the hidden part's only once it's worked out), so a kindergartner
// can count them, not just read the digits.
function bond(whole, part, hidden, worked) {
  const ring = (cx, cy, t, glow) => `<circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="${glow ? C.a : C.line}" stroke-width="3"${glow ? ' stroke-dasharray="4 3"' : ""}/>` + txt(cx, cy + 6, t, 17);
  const dots = (cx, n, color) => { let s = ""; for (let i = 0; i < n; i++) s += `<circle cx="${cx - 18 + (i % 5) * 9}" cy="${104 + Math.floor(i / 5) * 9}" r="3.5" fill="${color}"/>`; return s; };
  const rows = Math.max(Math.ceil(part / 5), worked ? Math.ceil(hidden / 5) : 0, 1);
  const s = `<path d="M75 36 L45 66 M85 36 L115 66" stroke="${C.line}" stroke-width="3"/>` + ring(80, 20, whole) + ring(40, 78, part) + ring(120, 78, worked ? hidden : "?", true)
    + dots(40, part, C.a) + (worked ? dots(120, hidden, C.b) : "");
  return svg(160, 104 + rows * 9, s, `number bond: ${whole} is ${part} and ${worked ? hidden : "?"}`);
}
const SYM = { "+": "+", "-": "−", "×": "×", "÷": "÷" };
// Missing-number facts (missing.js): hiddenFact's own (the second number hidden) and Quizard's,
// which hide either one (□ + 4 = 7). known is the number shown, whole the fact's answer.
// Adding: make 10 on a ten-frame with the empty spaces to count, number bonds, teen numbers as 10
// and some more, and otherwise counting up from the known number (8 + □ = 13: +2 to 10, +3 to
// 13). Subtracting, × and ÷: turn it into the fact that works it out (11 − □ = 4 → 11 − 4), with
// that fact's drawing.
function hiddenHint(f, worked) {
  const known = f.blank === "x" ? f.y : f.x, whole = f.fact.ans, end = worked ? f.ans : "?", line = `${f.q}, □ = ${end}`;
  if (f.op === "+" && whole === 10) {
    return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(known, C.a).concat(worked ? fill(f.ans, C.b) : [])), `ten-frame: ${known} and the empty spaces`),
      say: `How many more make 10? Count the empty spaces. ${line}`,
      grownups: "Make 10: kids find the partner that fills a ten-frame (7 and 3). These partners are what make 10 and adding within 20 build on." };
  }
  if (f.op === "+" && known === 10 && whole > 10) {
    return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(10, C.a)) + tenFrame(FRAME_W + 10, 0, fill(f.ans, C.b)), `${whole} is 10 and some more`),
      say: `${whole} is 10 and some more. ${line}`,
      grownups: "Teen numbers as 10 and some more: 14 is a full ten-frame and 4 more, so 10 + 4 = 14." };
  }
  if (f.op === "+" && whole < 10) {
    return { model: bond(whole, known, f.ans, worked),
      say: `${whole} is ${known} and how many more? ${line}`,
      grownups: "Number bonds: a whole and its two parts. Kids learn every way to break apart numbers to 10 (6 is 4 and 2), which is how they'll add and subtract later." };
  }
  if (f.op === "+") {
    const crosses = known < 10 && whole > 10;
    return { model: hops(known, whole, crosses ? 10 : [], worked),
      say: crosses ? `Count up from ${known}: +${10 - known} to 10, +${whole - 10} to ${whole}. □ = ${end}` : `Count up from ${known} to ${whole}. □ = ${end}`,
      grownups: "The unknown addend: 8 + □ = 13 asks how far it is from 8 to 13, so kids count up on an open number line, to 10 first, then the rest." };
  }
  const inv = f.inverse, h = hintFor(inv, worked);
  return { model: h.model, say: `${f.q} → ${inv.x} ${SYM[inv.op]} ${inv.y} = ${end}`, grownups: h.grownups };
}

// Zero and one (K and 3rd grade).
function zeroHint(f, worked) {
  const { op, x, y, ans } = f, end = worked ? ans : "?";
  if (op === "+") {
    const n = x || y;
    return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(n, C.a)), `${n} dots and none more`),
      say: `Adding zero: ${n} and none more. ${x} + ${y} = ${end}`,
      grownups: "Adding zero: none more, so the number stays the same." };
  }
  if (op === "-") {
    return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(x, C.a), x - y), `${x} dots, take away ${y}`),
      say: (y === 0 ? `Take away none: they're all still there.` : `Take away all of them: none are left.`) + ` ${x} − ${y} = ${end}`,
      grownups: "Zero in subtraction: taking away none leaves them all; taking away all of them leaves none." };
  }
  // 0 × n is no groups at all; n × 0 and 0 ÷ n are empty groups.
  const grownupsX = "Times zero: zero groups of 7, or 7 groups of zero, is nothing at all.";
  if (op === "×" && x === 0) {
    const model = svg(124, 32, `<rect x="2" y="2" width="120" height="28" rx="14" fill="none" stroke="${C.line}" stroke-width="2" stroke-dasharray="5 4"/>` + txt(62, 21, "no groups", 14, C.muted), "no groups");
    return { model, say: `Zero groups of ${y}: nothing at all. ${x} × ${y} = ${end}`, grownups: grownupsX };
  }
  const groups = Math.max(1, op === "×" ? x : y);
  let s = "";
  for (let i = 0; i < groups; i++) s += `<circle cx="${16 + i * 30}" cy="16" r="12" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
  const model = svg(groups * 30 + 2, 32, s, plural(groups, "empty group"));
  if (op === "×") return { model, say: `${x === 1 ? "1 group with nothing in it" : x + " groups with nothing in them"}: nothing at all. ${x} × ${y} = ${end}`, grownups: grownupsX };
  return { model, say: `Share nothing into ${plural(y, "group")}: nothing in each. ${x} ÷ ${y} = ${end}`,
    grownups: "Zero divided by a number: sharing nothing out leaves nothing in each group. (Dividing by zero isn't asked: it has no answer.)" };
}

// Three-digit numbers, 10 or 100 more or less (2nd grade): a place-value chart, with the place
// that changes in coral.
function placeChart(n, changed) {
  const ds = String(n).padStart(3, "0").split(""), names = ["hundreds", "tens", "ones"];
  let s = "";
  ds.forEach((d, i) => {
    const x = 6 + i * 62, on = i === changed;
    s += `<rect x="${x}" y="4" width="56" height="62" rx="6" fill="none" stroke="${on ? C.b : C.line}" stroke-width="${on ? 3.5 : 2}"/>`;
    s += `<text x="${x + 28}" y="44" text-anchor="middle" fill="${on ? C.b : C.ink}" font-size="30" font-weight="900">${d}</text>`;
    s += `<text x="${x + 28}" y="60" text-anchor="middle" fill="${C.muted}" font-size="10" font-weight="800">${names[i]}</text>`;
  });
  return svg(194, 70, s, `${n} in hundreds, tens and ones`);
}
function hundredsHint(f, worked) {
  const { op, x, y, ans } = f, n = op === "+" ? Math.max(x, y) : x, step = op === "+" ? Math.min(x, y) : y, end = worked ? ans : "?";
  const tens = Math.floor(n / 10) % 10, place = step === 100 ? "hundreds" : "tens", more = op === "+";
  const grownups = "10 more and 100 more: with place value, only one digit changes (345 + 10 = 355). When the tens are full (395 + 10), 10 tens make a new hundred.";
  let say;
  if (step === 10 && more && tens === 9) say = `10 more: 9 tens and 1 more ten is 10 tens, a new hundred.`;
  else if (step === 10 && !more && tens === 0) say = `10 less: there are no tens, so break a hundred into 10 tens.`;
  else say = `${step} ${more ? "more" : "less"}: the ${place} go ${more ? "up" : "down"} by 1.`;
  return { model: placeChart(n, step === 100 ? 0 : 1), say: `${say} ${x} ${op === "+" ? "+" : "−"} ${y} = ${end}`, grownups };
}

/* ---------- within 1000 (2nd grade, 2.NBT.B.7; 3rd grade's fluency, 3.NBT.A.2) ----------
   Adding: each number as hundreds, tens and ones on a place-value mat (flats, rods and cubes, the
   first number gold, the second coral), each place added, then the places together: partial sums
   (287 + 359: 200 + 300 = 500, 80 + 50 = 130, 7 + 9 = 16, then 500 + 130 + 16). Subtracting
   without regrouping: take away each place, crossed out on the mat. With regrouping: think
   addition on an open number line, counting up from the smaller number to the next ten, the next
   hundred, by hundreds, then the rest (403 − 158: +2, +40, +200, +3). Never the carrying or
   borrowing algorithm (4th grade), and before answering never the total. */
const FL = 20, RW = 4, CU = 4, GAPB = 2;
const digitsOf = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
// One place's blocks: n flats (rows of 5), rods or cubes (rows of 5), bottom-aligned at y, from x.
// cross: how many of them (the last ones) are crossed out. Returns { s, w, h }.
function placeBlocks(place, n, x, y, color, cross) {
  let s = "";
  const X = (x0, y0, w, h) => `<path d="M${x0 - 1} ${y0 - 1}L${x0 + w + 1} ${y0 + h + 1}M${x0 + w + 1} ${y0 - 1}L${x0 - 1} ${y0 + h + 1}" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  const crossed = (i) => cross && i >= n - cross;
  if (place === 0) {
    for (let i = 0; i < n; i++) {
      const fx = x + (i % 5) * (FL + GAPB), fy = y - FL - Math.floor(i / 5) * (FL + GAPB);
      s += `<rect x="${fx}" y="${fy}" width="${FL}" height="${FL}" rx="1.5" fill="${color}"/>`;
      for (let k = 1; k < 5; k++) s += `<line x1="${fx + k * 4}" y1="${fy}" x2="${fx + k * 4}" y2="${fy + FL}" stroke="var(--dark)" stroke-width=".6"/><line x1="${fx}" y1="${fy + k * 4}" x2="${fx + FL}" y2="${fy + k * 4}" stroke="var(--dark)" stroke-width=".6"/>`;
      if (crossed(i)) s += X(fx, fy, FL, FL);
    }
    return { s, w: n ? Math.min(n, 5) * (FL + GAPB) - GAPB : 0, h: n ? Math.ceil(n / 5) * (FL + GAPB) - GAPB : 0 };
  }
  if (place === 1) {
    for (let i = 0; i < n; i++) {
      const rx = x + i * (RW + GAPB);
      s += `<rect x="${rx}" y="${y - FL}" width="${RW}" height="${FL}" rx="1" fill="${color}"/>`;
      for (let k = 1; k < 5; k++) s += `<line x1="${rx}" y1="${y - FL + k * 4}" x2="${rx + RW}" y2="${y - FL + k * 4}" stroke="var(--dark)" stroke-width=".6"/>`;
      if (crossed(i)) s += X(rx, y - FL, RW, FL);
    }
    return { s, w: n ? n * (RW + GAPB) - GAPB : 0, h: n ? FL : 0 };
  }
  for (let i = 0; i < n; i++) {
    const cx = x + (i % 5) * (CU + GAPB), cy = y - CU - Math.floor(i / 5) * (CU + GAPB);
    s += `<rect x="${cx}" y="${cy}" width="${CU}" height="${CU}" rx=".8" fill="${color}"/>`;
    if (crossed(i)) s += X(cx, cy, CU, CU);
  }
  return { s, w: n ? Math.min(n, 5) * (CU + GAPB) - GAPB : 0, h: n ? FL : 0 };
}
// The mat: a column for hundreds, tens and ones, each row a number ([{ n, color, cross: [h, t, o] }]),
// and under each column a label (labels: three strings, or none).
function placeMat(rows, labels, label) {
  const colW = [0, 1, 2].map((p) => Math.max(p ? 24 : 40, ...rows.map((r) => placeBlocks(p, digitsOf(r.n)[p], 0, 0, "").w)) + 14);
  const rowH = rows.map((r) => Math.max(FL, placeBlocks(0, digitsOf(r.n)[0], 0, 0, "").h));
  const top = 16, H = top + rowH.reduce((t, h) => t + h + 8, 0) + (labels ? 20 : 2), W = colW.reduce((t, w) => t + w, 0);
  let s = "", x = 0;
  ["hundreds", "tens", "ones"].forEach((name, p) => {
    if (p) s += `<line x1="${x}" y1="4" x2="${x}" y2="${H - 4}" stroke="${C.line}" stroke-width="1.5"/>`;
    s += txt(x + colW[p] / 2, 11, name, 9, C.muted);
    let y = top;
    rows.forEach((r, i) => { y += rowH[i] + 4; s += placeBlocks(p, digitsOf(r.n)[p], x + 7, y, r.color, (r.cross || [])[p]).s; y += 4; });
    if (labels && labels[p]) s += txt(x + colW[p] / 2, H - 5, labels[p], 13, C.a);
    x += colW[p];
  });
  return svg(W, H, s, label);
}
function threeDigitHint(f, worked) {
  const { op, x, y, ans } = f, end = worked ? ans : "?", PLACE = [100, 10, 1];
  const dx = digitsOf(x), dy = digitsOf(y);
  if (op === "+") {
    const sums = PLACE.map((p, i) => (dx[i] + dy[i]) * p);
    const steps = PLACE.map((p, i) => (dx[i] && dy[i] ? `${dx[i] * p} + ${dy[i] * p} = ${sums[i]}` : "")).filter(Boolean);
    return { model: placeMat([{ n: x, color: C.a }, { n: y, color: C.b }], sums.map((v) => (v ? String(v) : "")), `${x} and ${y} in hundreds, tens and ones`),
      say: `Add each place: ${steps.join(", ")}. ${sums.filter(Boolean).join(" + ")} = ${end}`,
      grownups: "Adding within 1000 (place value): kids add the hundreds, the tens and the ones, then put the parts together (287 + 359 is 500 + 130 + 16). Ten ones make a ten and ten tens a hundred, which is all regrouping is; the carrying algorithm waits for 4th grade." };
  }
  // Enough in every place: take away each place, crossed out on the mat.
  if (dx.every((d, i) => d >= dy[i])) {
    const parts = PLACE.map((p, i) => (dy[i] ? `${dx[i] * p} − ${dy[i] * p}` + (worked ? ` = ${(dx[i] - dy[i]) * p}` : "") : "")).filter(Boolean);
    const left = PLACE.map((p, i) => (dx[i] - dy[i]) * p).filter(Boolean);
    return { model: placeMat([{ n: x, color: C.a, cross: dy }], null, `${x} in hundreds, tens and ones, take away ${y}`),
      say: `Take away each place: ${parts.join(", ")}.${worked && left.length > 1 ? ` ${left.join(" + ")} = ${ans}` : ` ${x} − ${y} = ${end}`}`,
      grownups: "Taking away by place: when each place has enough, kids take the hundreds from the hundreds, the tens from the tens and the ones from the ones (821 − 511: 800 − 500, 20 − 10, 1 − 1)." };
  }
  // Count up from y: to the next ten, the next hundred, by hundreds, then the rest.
  const ten = Math.ceil(y / 10) * 10, hundred = Math.ceil(y / 100) * 100, base = Math.floor(x / 100) * 100;
  const stops = [y, ten, hundred, base, x].filter((v, i, a) => a.indexOf(v) === i && v >= y && v <= x).sort((a, b) => a - b);
  const jumps = stops.slice(1).map((v, i) => v - stops[i]);
  return { model: hops(y, x, stops.slice(1, -1), worked),
    say: `Think addition: count up from ${y} to ${x}. ${jumps.length > 1 ? jumps.join(" + ") : x + " − " + y} = ${end}`,
    grownups: "Think addition on an open number line: when a place doesn't have enough (403 − 158), kids count up from the smaller number, to the next ten, the next hundred, by hundreds, then the rest, and add up the jumps. Borrowing waits for 4th grade." };
}

// Comparing three-digit numbers (2nd grade): the two numbers in a place-value chart, one over the
// other. Before answering the place that decides is outlined (the first that's different, from
// the hundreds); worked, the bigger digit there is ringed in gold and the comparison written.
function compare1000Hint(f, worked) {
  const a = Number(f.l), b = Number(f.r), da = String(a).split(""), db = String(b).split("");
  const at = [0, 1, 2].find((i) => da[i] !== db[i]), names = ["hundreds", "tens", "ones"];
  let s = "";
  names.forEach((name, i) => {
    const x = 6 + i * 50, on = i === at;
    s += txt(x + 22, 11, name, 9, C.muted);
    if (on) s += `<rect x="${x - 2}" y="15" width="48" height="66" rx="8" fill="none" stroke="${C.b}" stroke-width="3"/>`;
    [[da[i], 20], [db[i], 50]].forEach(([d, y], k) => {
      const big = worked && on && Number(d) > Number((k ? da : db)[i]);
      s += `<rect x="${x + 2}" y="${y}" width="40" height="26" rx="5" fill="none" stroke="${big ? C.a : C.line}" stroke-width="${big ? 3 : 1.5}"/>` + txt(x + 22, y + 20, d, 20, big ? C.a : C.ink);
    });
  });
  if (worked) s += compareLine(81, 104, f);
  const model = svg(162, worked ? 112 : 86, s, `${a} and ${b} in hundreds, tens and ones`);
  const D = (d, place) => `${d} ${d === "1" ? place.slice(0, -1) : place}`;
  const same = at == null ? "Same hundreds, tens and ones." : at === 0 ? "" : `Same ${at === 1 ? "hundreds" : "hundreds and tens"}. `;
  const look = at == null ? "" : `${at === 0 ? "Compare the hundreds first" : `Then the ${names[at]}`}: ${D(da[at], names[at])} and ${D(db[at], names[at])}.`;
  return { model, say: `${same}${look} ${worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r}`.replace(/\s+/g, " ").trim(),
    grownups: "Comparing three-digit numbers: kids look at the hundreds first; if they're the same, the tens; then the ones. The bigger digit in the first place that's different makes the bigger number, and the open side of < or > faces it." };
}

// Adding up to four two-digit numbers (2nd grade, 2.NBT.B.7): each number in tens and ones. When
// two numbers' ones make a ten (23 + 17), find that ten first; otherwise add the tens, then the ones.
function sumsHint(f, worked) {
  const nums = f.nums, end = worked ? f.ans : "?", pair = tenPairOf(nums);
  let s = "", x = 4;
  nums.forEach((n, i) => {
    const b = blocks(n, x, i % 2 ? C.b : C.a);
    if (pair && pair.includes(i)) s += `<rect x="${x - 3}" y="1" width="${b.w + 6}" height="56" rx="5" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="4 3"/>`;
    s += b.s + txt(x + b.w / 2, 72, n, 13);
    x += b.w + 14;
  });
  const model = svg(x - 6, 78, s, `${nums.join(", ")} in tens and ones`);
  const grownups = "Adding several numbers: numbers can be added in any order, so kids look for two whose ones make a ten (23 + 17 = 40) and add those first; otherwise they add all the tens, then all the ones, then put them together.";
  if (pair) {
    const [i, j] = pair, ten = nums[i] + nums[j], rest = nums.filter((_, k) => k !== i && k !== j);
    return { model, say: `Find a ten: ${nums[i]} + ${nums[j]} = ${ten}. ${[ten, ...rest].join(" + ")} = ${end}`, grownups };
  }
  const tens = nums.map((n) => n - (n % 10)), ones = nums.map((n) => n % 10), T = tens.reduce((t, n) => t + n, 0), O = ones.reduce((t, n) => t + n, 0);
  return { model, say: `Add the tens: ${tens.join(" + ")} = ${T}. Add the ones: ${ones.join(" + ")} = ${O}. ${T} + ${O} = ${end}`, grownups };
}

// × tens (3rd grade): 4 × 30 is 3 tens (rods), 4 times: 12 tens. One row of rods and "× 4",
// so it stays short on a phone.
function timesTensHint(f, worked) {
  const a = Math.min(f.x, f.y), T = Math.max(f.x, f.y), t = T / 10, rods = blocks(T, 4, C.a);
  return { model: svg(rods.w + 54, 58, rods.s + txt(rods.w + 10, 37, `× ${a}`, 22, C.b, "start"), `${t} tens, ${a} times`),
    // Before answering, the fact to use and its place, not its product ("12 tens" is the answer).
    say: worked ? `${a} × ${t} tens is ${a * t} tens, ${f.ans}. ${f.x} × ${f.y} = ${f.ans}` : `Think ${a} × ${t}, in tens. ${f.x} × ${f.y} = ?`,
    grownups: "Times tens: 4 × 30 is 4 groups of 3 tens, which is 12 tens, 120. It's the fact 4 × 3 in tens, place value rather than \"add a zero\"." };
}

// Fractions (3rd grade): two fraction bars the same length, the same amount shaded.
function fractionHint(f, worked) {
  // Each bar labeled with its fraction: "1/2" over "□/4" (the □ filled in once worked).
  const wholes = Math.max(1, Math.ceil(f.a / f.b), Math.ceil(f.ans / f.d)), X0 = 44, W = 200 / wholes;
  const bar = (y, parts, shaded, color, dashed) => {
    let s = "";
    for (let w = 0; w < wholes; w++) for (let i = 0; i < parts; i++) {
      const k = w * parts + i, x = X0 + w * W + i * (W / parts);
      s += `<rect x="${x}" y="${y}" width="${W / parts}" height="26" fill="${k < shaded ? color : "none"}" fill-opacity="${dashed ? 0.35 : 1}" stroke="${C.ink}" stroke-width="2"/>`;
    }
    return s;
  };
  const top = f.b === 1 ? String(f.a) : `${f.a}/${f.b}`, bottom = `${worked ? f.ans : "□"}/${f.d}`;
  const model = svg(250, 70, txt(X0 - 8, 23, top, 15, C.a, "end") + bar(4, f.b, f.a, C.a) + txt(X0 - 8, 57, bottom, 15, C.b, "end") + bar(38, f.d, (f.a / f.b) * f.d, C.b, !worked),
    `fraction bars: ${top} and ${bottom}`);
  const unit = unitName(f.d);
  return { model, say: `The same amount is shaded. Count the shaded ${unit}: □ = ${worked ? f.ans : "?"}`,
    grownups: "Equal fractions with fraction bars: two bars the same length, cut into different pieces. 1/2 and 2/4 shade the same amount, so they're equal. A whole is all its pieces: 4/4 = 1." };
}

// Comparing fractions (3rd grade, 3.NF.A.3d): the two fractions as fraction bars of the same whole,
// one over the other, each labeled and shaded, so they line up. Same denominator: same size
// pieces, more pieces is more; same numerator: the same number of pieces, bigger pieces is more;
// equal fractions: line them up. Before answering, no symbol and no ring; worked, the bigger bar
// ringed in gold (both for =) and the comparison written under them.
export const FRAC_RULE = { den: "Same size pieces: more pieces is more.", num: "Same number of pieces: bigger pieces is more.", eq: "Line up the bars. Which shades more?" };
function fracCompareHint(f, worked) {
  const X0 = 44, W = 200, rows = [[f.l, 4, C.a], [f.r, 38, C.b]];
  let s = "";
  rows.forEach(([t, y, color]) => {
    const [n, d] = t.split("/").map(Number);
    s += txt(X0 - 8, y + 19, t, 15, color, "end");
    for (let i = 0; i < d; i++) s += `<rect x="${f1(X0 + i * W / d)}" y="${y}" width="${f1(W / d)}" height="26" fill="${i < n ? color : "none"}" stroke="${C.ink}" stroke-width="2"/>`;
  });
  if (worked) {
    const big = f.sym === "=" ? [0, 1] : f.sym === ">" ? [0] : [1];
    big.forEach((i) => { s += `<rect x="${X0 - 4}" y="${rows[i][1] - 4}" width="${W + 8}" height="34" rx="6" fill="none" stroke="${C.a}" stroke-width="3"/>`; });
    s += compareLine(X0 + W / 2, 90, f);
  }
  const model = svg(250, worked ? 98 : 70, s, `fraction bars: ${f.l} and ${f.r}`);
  return { model, say: `${FRAC_RULE[f.frac]} ${worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r}`,
    grownups: "Comparing fractions: with the same bottom number the pieces are the same size, so more pieces is more (5/8 > 3/8). With the same top number there are as many pieces, so bigger pieces is more: halves are bigger than sixths, so 2/3 > 2/6. Fraction bars of the same whole show it; the open side of < or > faces the bigger one." };
}

// Rounding (3rd grade): where the number sits on a number line between two tens (or hundreds).
function roundHint(f, worked) {
  const lo = Math.floor(f.n / f.to) * f.to, hi = lo + f.to, mid = lo + f.to / 2, x = (n) => 30 + (n - lo) / f.to * 200;
  let s = `<line x1="8" y1="40" x2="252" y2="40" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
  for (const [n, col] of [[lo, C.ink], [mid, C.muted], [hi, C.ink]]) s += `<line x1="${x(n)}" y1="33" x2="${x(n)}" y2="47" stroke="${col}" stroke-width="2.5"/><text x="${x(n)}" y="64" text-anchor="middle" fill="${col}" font-size="${String(n).length > 4 ? 12 : 13}" font-weight="800">${n}</text>`;
  s += `<circle cx="${x(f.n)}" cy="40" r="6" fill="${C.b}"/><text x="${x(f.n)}" y="22" text-anchor="middle" fill="${C.b}" font-size="14" font-weight="900">${f.n}</text>`;
  const where = f.n === mid ? "is halfway, so it rounds up" : f.n > mid ? "is past halfway, so it rounds up" : "is before halfway, so it rounds down";
  return { model: svg(260, 70, s, `${f.n} on a number line from ${lo} to ${hi}`),
    say: `${f.n} is between ${lo} and ${hi}. Halfway is ${mid}, and ${f.n} ${where}. □ = ${worked ? f.ans : "?"}`,
    grownups: "Rounding on a number line: kids find the two tens (or hundreds) a number sits between and which one it's closer to. Halfway rounds up." };
}

// Area and perimeter (3rd grade): the rectangle with its squares, or its four sides.
// Drawn for the hint with small squares and big labels, so it stays readable when a phone shrinks
// it to the hint's height (the problem's own drawing, third.js rectSvg, is bigger).
function rectModel(f) {
  const per = f.kind === "p", u = 11, W = f.w * u, H = f.h * u, x0 = 24, y0 = per ? 20 : 6;
  let s = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${C.a}" fill-opacity=".2" stroke="${C.ink}" stroke-width="2.5"/>`;
  if (!per) {
    for (let i = 1; i < f.w; i++) s += `<line x1="${x0 + i * u}" y1="${y0}" x2="${x0 + i * u}" y2="${y0 + H}" stroke="${C.ink}" stroke-opacity=".45" stroke-width="1.2"/>`;
    for (let i = 1; i < f.h; i++) s += `<line x1="${x0}" y1="${y0 + i * u}" x2="${x0 + W}" y2="${y0 + i * u}" stroke="${C.ink}" stroke-opacity=".45" stroke-width="1.2"/>`;
  }
  s += txt(x0 + W / 2, y0 + H + 18, f.w, 16) + txt(x0 - 12, y0 + H / 2 + 6, f.h, 16);
  if (per) s += txt(x0 + W / 2, y0 - 6, f.w, 16) + txt(x0 + W + 12, y0 + H / 2 + 6, f.h, 16);
  return svg(x0 + W + (per ? 26 : 8), y0 + H + 24, s, `a rectangle ${f.w} by ${f.h}`);
}
function rectHint(f, worked) {
  const end = worked ? f.ans : "?";
  if (f.kind === "a") return { model: rectModel(f), say: `Count the squares, or rows × columns: ${f.h} × ${f.w} = ${end}`,
    grownups: "Area: the squares that cover a shape. Kids count them, then see the rows and columns as multiplication." };
  return { model: rectModel(f), say: `Add all four sides: ${f.w} + ${f.h} + ${f.w} + ${f.h} = ${end}`,
    grownups: "Perimeter: the distance all the way around, every side added. A rectangle's opposite sides are the same." };
}

// Three numbers (1st grade): find the two that make 10, then add the one left. Two ten-frames:
// the ten (its two numbers in gold and coral), then the rest.
function threeHint(f, worked) {
  const { ten: [a, b], rest } = tenOf(f), end = worked ? f.ans : "?";
  return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(a, C.a).concat(fill(b, C.b))) + tenFrame(FRAME_W + 10, 0, fill(rest, C.a)), `ten-frames: ${a} and ${b} make 10, and ${rest} more`),
    say: `Find the ten: ${a} + ${b} = 10. 10 + ${rest} = ${end}`,
    grownups: "Three numbers: kids look for two that make 10 (4 + 3 + 6: the 4 and the 6), then add the third. Numbers can be added in any order, so the ten can come first." };
}
// Arrays (2nd grade): the rows, each ringed. Before answering, the running total counts on by
// rows only partway, to the halfway row (or just the first row of 2 or 3), and the rows still to
// go are dimmed with no total, like the squares hint (shapes.js), so it never counts to the end.
// Worked, every row has its running total.
export const arrayRowsCounted = (f, worked) => (worked ? f.r : f.r <= 3 ? 1 : Math.floor(f.r / 2));
function arrayHint(f, worked) {
  const G = 16, w = f.c * G + 4, upto = arrayRowsCounted(f, worked);
  let s = "";
  for (let r = 0; r < f.r; r++) {
    const y = 9 + r * G, dim = r >= upto;
    s += `<g${dim ? ' opacity=".35"' : ""}><rect x="2" y="${y - 7}" width="${w - 4}" height="14" rx="7" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
    for (let c = 0; c < f.c; c++) s += `<circle cx="${10 + c * G}" cy="${y}" r="5" fill="${r % 2 ? C.b : C.a}"/>`;
    s += "</g>";
    if (!dim) s += txt(w + 6, y + 5, (r + 1) * f.c, 13, C.ink, "start");
  }
  const run = Array.from({ length: upto }, (_, i) => (i + 1) * f.c).join(", ");
  return { model: svg(w + 34, f.r * G + 4, s, `${f.r} rows of ${f.c}`),
    say: worked ? `Add the rows: ${Array(f.r).fill(f.c).join(" + ")} = ${f.ans}` : `Each row has ${f.c}: ${run}, … How many in ${f.r} rows? ${Array(f.r).fill(f.c).join(" + ")} = ?`,
    grownups: "Arrays: things in equal rows and columns. 2nd graders add the equal rows (3 rows of 5 is 5 + 5 + 5, or 5, 10, 15), the step before multiplication." };
}

// A drawing from another module (the clock, the slimes), fitted into a box no taller than maxH
// units, so it stays wide and short like the other hints; its own viewBox is kept inside.
const f1 = (n) => Math.round(n * 10) / 10;
function fitted(inner, maxH, label, view) {
  const m = (view ? `viewBox="${view}"` : inner).match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/), w = Number(m[3]), h = Number(m[4]), k = Math.min(1, maxH / h);
  const W = f1(w * k), H = f1(h * k);
  const body = inner.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${W}" height="${H}" viewBox="${m[1]} ${m[2]} ${w} ${h}" overflow="visible">`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${f1(W * SCALE)}" height="${f1(H * SCALE)}" role="img" aria-label="${label}">${body}</svg>`;
}
// Telling time (Tick-Tockus, js/clock.js): the clock with the hint drawn on it (the hour hand
// glowing, the hour ringed, the count by 5s round the rim), or for elapsed time the minute hand's
// sweep (in the hour) or the open number line (across it). In a fight the drawing goes on
// Tick-Tockus's own clock (app.js); this one is for the Oops card and the grown-ups' page.
const TIME_WHY = {
  hours: "Telling time: the short hand shows the hour and the long hand the minutes. On the hour, the long hand points straight up at the 12: o'clock.",
  half: "Half past: the long hand is on the 6, halfway round, and the short hand is halfway between two numbers, just past the hour it's half past.",
  time: "Writing the time: the hour from the short hand, then the minutes from the long hand, counted by 5s from the 12 (3:35). Kids write it the way a digital clock shows it.",
  five: "5 minutes: each number on the clock is 5 more minutes, so kids count by 5s from the 12 to the long hand.",
  minute: "To the minute: count by 5s to the last number the long hand passed, then the little marks by 1s (35, 36, 37).",
  sweep: "Elapsed time in the hour: the long hand sweeps from the start to the end, counted by 5s round the clock.",
  line: "Elapsed time across the hour: an open number line, jumping from the start to a friendly time (the next quarter hour, then the hour), then on to the end. Add up the jumps."
};
function timeHintFor(f, worked) {
  const h = clockFactHint(f, worked);
  if (f.kind === "long" || f.kind === "add") {
    return { model: fitted(elapsedSvg(f, { hint: true, worked }), 150, f.kind === "long" ? `from ${f.q.replace(" → ", " to ")}` : f.q), say: h.say, grownups: inHour(f) ? TIME_WHY.sweep : TIME_WHY.line };
  }
  const why = f.kind === "time" ? TIME_WHY.time : f.kind === "hour" ? (f.m ? TIME_WHY.half : TIME_WHY.hours) : f.m % 5 ? TIME_WHY.minute : TIME_WHY.five;
  return { model: fitted(clockSvg(f.h, f.m, { monster: false, hint: h.layer, label: "the clock" }), 150, "the clock, with the hint on it", "-16 -16 272 272"), say: h.say, grownups: why, layer: h.layer };
}
// What comes next (Slimelipsis, js/patterns.js): the hops from slime to slime, each the step;
// odd and even, each number's dots in pairs. In a fight they're drawn on the problem's own slimes.
function patternHintFor(f, worked) {
  const h = patternFactHint(f, worked);
  if (f.op === "◐") {
    return { model: fitted(oddEvenSvg(f, { hint: true, worked, perRow: f.nums.length }), 120, f.nums.join(", ")), say: h.say,
      grownups: "Odd and even: pair up the dots, and a dot left over means odd. Past 20, the ones digit tells: numbers ending in 0, 2, 4, 6 or 8 are even." };
  }
  return { model: fitted(patternSvg(f, { hops: h.hops, state: worked ? "right" : null }), 150, f.q), say: h.say, hops: h.hops,
    grownups: "Counting patterns: each number is the same step more (or less) than the one before, like hops on a number line: +2, +2, +2. Kids say the step, then take it once more." };
}

// Batch 2 (DESIGN.md §4.1), each drawn on its own picture: in a fight on the problem's picture
// (app.js), here for the Oops card and the grown-ups' page.
// True or false (the Equal Twins): the scale with each side's dots to count, level until it's
// answered; fix it: the false equation's scale, tipped, and the side to work out.
function tfHintFor(f, worked) {
  const h = tfHint(f, worked);
  return { model: fitted(tfSvg(f, { hint: true, worked }), 150, f.q), say: h.say,
    grownups: f.kind === "fix"
      ? "Fix it: the equal sign means both sides are the same amount. Kids work out the side they can, then find the number that makes the other side match."
      : "True or false: the equal sign means 'the same amount as', not 'the answer comes next'. Kids work out each side; if they match, it balances and it's true, even written 7 = 3 + 4 or 6 = 6." };
}
// The number line (Halfling): jumps of 1/4 from 0 to the dot, counted partway before answering;
// how many equal parts, counted to halfway.
function lineHintFor(f, worked) {
  return { model: fitted(lineSvg(f, { hint: true, worked }), 120, f.kind === "parts" ? "a number line in equal parts" : "a number line with a dot"), say: lineHint(f, worked).say,
    grownups: f.kind === "parts"
      ? "Equal parts: 0 to 1 on a number line is one whole, cut into equal parts. The number of parts is the bottom number of the fraction."
      : "Fractions on a number line: 0 to 1 is cut into equal parts, and each jump is one part (1/4). The dot is how many jumps from 0: 3 jumps of 1/4 is 3/4. Past 1, keep counting: 5/4." };
}
// Place value (Haberhasher): base-ten blocks on a place-value mat, each place's value under it.
function pvHintFor(f, worked) {
  return { model: fitted(pvSvg(f, { hint: true, worked }), 150, "base-ten blocks on a place-value mat"), say: pvHint(f, worked).say,
    grownups: f.kind === "tens" || f.kind === "odd"
      ? "Tens in a number: 10 tens make a hundred, so 120 is 12 tens, and 34 tens and 3 ones is 343. Kids trade a flat for ten rods (or ten rods for a flat) to see it."
      : "Place value: a three-digit number is hundreds, tens and ones (345 is 3 flats, 4 rods and 5 cubes, or 300 + 40 + 5)." };
}
// Dollars (Trollar): count on from the biggest bill, then the coins in cents, partway before answering.
function dollarHintFor(f, worked) {
  return { model: fitted(dollarSvg(f, { hint: true, worked }), 150, "bills and coins"), say: dollarHint(f, worked).say,
    grownups: "Dollars and cents: count on from the biggest bill (20, 25, 26 dollars), then the coins in cents. 2nd grade writes it as $26 and 41¢; the decimal ($26.41) waits for 4th grade." };
}

// Shapes (Polly-Gon, js/shapes.js). Drawing: the shape's corners as dots to join, the first sides
// drawn; worked, the whole shape with its sides numbered. Counting: drawn on the problem's own
// picture in a fight (app.js), numbering the sides, corners or parts about halfway; a cube's faces
// as the 3 you see and the 3 behind; squares by rows, partway.
const SHAPE_WHY = {
  draw: "Drawing shapes: kids name a shape by its sides and corners (a triangle has 3 of each), whatever its size or which way it's turned. A square is a rectangle too, so it counts for one.",
  sides: "Sides and corners: go round the shape with a finger, counting each side (or corner) once, starting at the top. The count names it: 3 is a triangle, 5 a pentagon, 6 a hexagon.",
  faces: "Faces of a solid: count the flat faces you can see, then the ones hiding at the back (a cube has 3 you can see and 3 behind).",
  parts: "Equal shares: a whole cut into same-size parts. 2 equal parts are halves, 3 thirds, 4 fourths (or quarters); more parts make each one smaller.",
  squares: "Rows and columns: a rectangle cut into same-size squares. Kids count a row, then count on by rows (4, 8, 12), the start of area and multiplication.",
  unit: "Unit fractions: a whole cut into equal parts. Each part is 1 over the number of parts: 4 equal parts, each is 1/4 of the whole."
};
function shapeHintFor(f, worked) {
  if (f.kind === "draw") {
    return { model: fitted(drawHintSvg(f.shape, worked), 130, worked ? `${f.shape}` : "dots to join"), say: drawHint(f.shape, worked).say, grownups: SHAPE_WHY.draw };
  }
  // A tall one (4 rows of 2 squares) is kept short, as every hint's drawing is.
  const pic = countSvg(f, { hint: true, worked }), [, , w, h] = pic.match(/viewBox="([-\d.]+ ){2}([\d.]+) ([\d.]+)"/).map(Number);
  return { model: fitted(pic, h > w * 1.2 ? 80 : 130, "the shape, with the hint on it"), say: countHint(f, worked).say, grownups: SHAPE_WHY[f.kind === "corners" ? "sides" : f.kind] };
}

// The dot flash (Pipsqueak, js/flash.js): the dots back, colored by group ("2 and 2 make ?"). In a
// fight they come back on the problem's own card (app.js); here for the Oops card and the grown-ups' page.
const FLASH_WHY = {
  d: "How many at a glance: kids learn the dice patterns as pictures and see small groups inside them (a 5 is the 4 corners and 1 in the middle), so they know how many without counting one by one.",
  f: "Five-frames: 5 boxes in a row. Kids see how many are full, and how many empty, so 4 is \"one less than 5\" at a glance.",
  o: "Dominoes: each half is a small group seen at a glance, and the two halves put together make the whole: 3 and 2 make 5.",
  s: "Small groups: kids spot each little group without counting it (2, 2 and 1), then put them together."
};
function flashHintFor(f, worked) {
  return { model: fitted(flashSvg(f, { hint: true }), 90, "the dots, in groups"), say: flashHint(f, worked).say, grownups: FLASH_WHY[f.kind] };
}

// Reading charts (Graphzilla, js/charts.js): drawn on the chart itself. In a fight on the
// problem's own chart (app.js); here for the Oops card and the grown-ups' page.
const CHART_WHY = {
  read: "Reading a chart: count along a row of tallies (by 5s for each bundle) or pictures, or follow the top of a bar across to the numbers. A scaled graph counts by its scale: each picture is 2, half a picture is 1.",
  more: "How many more or fewer: line the two rows (or bars) up from the same start. The extra past the shorter one is the difference.",
  all: "In all: read each row or bar, then add them. Kids count one row, then count on.",
  plot: "Line plots and tables (4th grade): the mode is the value with the most (the tallest stack of Xs), the range is the biggest minus the smallest."
};
function chartHintFor(f, worked) {
  const k = f.ask.k, why = "mo ra at to".includes(k) ? CHART_WHY.plot : k === "m" || k === "f" ? CHART_WHY.more : k === "t" || k === "a" ? CHART_WHY.all : CHART_WHY.read;
  return { model: fitted(chartSvg(f, { hint: true, worked }), 150, "the chart, with the hint on it"), say: chartHint(f, worked).say, grownups: why };
}

// Measuring length (Rulerpillar, js/length.js): drawn on the thing and its ruler or units. In a
// fight on the problem's own picture (app.js); here for the Oops card and the grown-ups' page.
const LENGTH_WHY = {
  compare: "Comparing lengths: line the ends up, then look at the other ends. The one that goes past is longer.",
  string: "Comparing with a string: two things that can't be put side by side are each held to the same string. Longer than the string and shorter than it: the first is longer.",
  units: "Measuring with units: lay the cubes or paper clips end to end from one end, with no gaps and no overlaps, and count them.",
  ruler: "A ruler: start at 0 and count the jumps to the end (each jump is 1 inch or 1 centimeter). Not from 0? Count the jumps, or take the start from the end.",
  which: "Smaller units, more of them: a centimeter is smaller than an inch, so the same pencil is more centimeters long than inches.",
  estimate: "Estimating: picture the unit laid along it again and again. About how many fit?",
  diff: "How much longer: count on from the shorter one's end to the longer one's, or subtract.",
  add: "Adding and subtracting lengths: put the pieces end to end on a number line and jump."
};
function lengthHintFor(f, worked) {
  const why = { compare: "compare", order: "compare", indirect: "string", units: "units", gaps: "units", ruler: "ruler", which: "which", estimate: "estimate", diff: "diff", addsub: "add" }[f.kind];
  return { model: fitted(lengthSvg(f, { hint: true, worked }), 150, "the length, with the hint on it"), say: lengthHint(f, worked).say, grownups: LENGTH_WHY[why] };
}

export function hintFor(f, worked) {
  // 4th grade (hints4.js): its own models, the area model, partial quotients and the rest.
  if (isFourthHint(f)) return fourthHint(f, worked);
  if (f.op === "ℓ") return lengthHintFor(f, worked);
  if (f.op === "▥") return chartHintFor(f, worked);
  if (f.op === "⁙") return flashHintFor(f, worked);
  if (f.op === "◇") return shapeHintFor(f, worked);
  if (f.op === "✓" || f.op === "✎") return tfHintFor(f, worked);
  if (f.op === "↔") return lineHintFor(f, worked);
  if (f.op === "#") return pvHintFor(f, worked);
  if (f.op === "$") return dollarHintFor(f, worked);
  if (f.op === "⌚") return timeHintFor(f, worked);
  if (f.op === "…" || f.op === "◐") return patternHintFor(f, worked);
  if (f.op === "¢") return coinHint(f, worked);
  if (f.op === "Σ") return f.nums && Math.max(...f.nums) >= 10 ? sumsHint(f, worked) : threeHint(f, worked);
  if (f.op === "○" && f.frac) return fracCompareHint(f, worked);
  if (f.op === "○" && Math.max(Number(f.l), Number(f.r)) >= 100) return compare1000Hint(f, worked);
  if (f.op === "▦") return arrayHint(f, worked);
  if (f.op === "○" || f.op === "=") return balanceHint(f, worked);
  if (f.op === "more") return moreHint(f, worked);
  if (f.op === "/") return fractionHint(f, worked);
  if (f.op === "≈") return roundHint(f, worked);
  if (f.op === "▭") return rectHint(f, worked);
  if (f.blank) return hiddenHint(f, worked);
  // 10 or 100 more or less than a three-digit number. 100 − 77 and 100 − 20 are two-digit facts.
  const step = f.op === "+" ? Math.min(f.x, f.y) : f.y, from = f.op === "+" ? Math.max(f.x, f.y) : f.x;
  if ((f.op === "+" || f.op === "-") && (step === 10 || step === 100) && from > 100) return hundredsHint(f, worked);
  if (f.op === "×" && Math.min(f.x, f.y) >= 2 && Math.max(f.x, f.y) >= 20) return timesTensHint(f, worked);
  if (f.x === 0 || f.y === 0 || (f.op === "-" && f.x === f.y)) return zeroHint(f, worked);
  if ((f.op === "+" || f.op === "-") && Math.max(f.x, f.y) > 100) return threeDigitHint(f, worked);
  if ((f.op === "+" && f.ans > 20) || (f.op === "-" && f.x > 20)) return twoDigitHint(f, worked);
  const { op, x, y, ans } = f, end = (t) => (worked ? t : "?");
  if (op === "+") {
    const big = Math.max(x, y), small = Math.min(x, y);
    if (ans <= 10) {
      return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(x, C.a).concat(fill(y, C.b))), `ten-frame: ${x} and ${y}`),
        say: `Put together ${x} and ${y}. ${x} + ${y} = ${end(ans)}`,
        grownups: "Ten-frame: kids count the dots, and learn to see 5 and some more without counting." };
    }
    // Teen numbers keep the problem's order: 4 + 10 shows the 4 first, then the full ten.
    const two = (first, second) => svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, first) + tenFrame(FRAME_W + 10, 0, second), `ten-frames: ${x} and ${y}`);
    if (big === 10) {
      const ten = fill(10, C.a), some = fill(small, C.b);
      return { model: x === 10 ? two(ten, some) : two(some, ten),
        say: `10 and some more: ${x} + ${y} = ${end(ans)}`,
        grownups: "Teen numbers as 10 and some more: 14 is a full ten-frame and 4 more." };
    }
    if (big > 10) {
      const ones = big - 10, sum = x === big ? `10 + ${ones} + ${small}` : `${small} + 10 + ${ones}`;
      return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(10, C.a)) + tenFrame(FRAME_W + 10, 0, fill(ones, C.a).concat(fill(small, C.b))), `${big} is 10 and ${ones}, and ${small} more`),
        say: `${big} is 10 + ${ones}. ${sum} = ${end(ans)}`,
        grownups: "Teen numbers as 10 and some more: 13 + 4 is 10 + 3 + 4, so only the ones change." };
    }
    if (x === y) {
      const extra = x - 5;
      return { model: doubleRows(x),
        say: `Doubles: two rows of ${x}. 5 + 5 = 10, and ${extra} + ${extra} = ${extra * 2}. 10 + ${extra * 2} = ${end(ans)}`,
        grownups: "Doubles: kids learn doubles (8 + 8) as facts of their own, seen as two equal rows. Each row is 5 and some more, so the two 5s make 10. Doubles plus one and × 2 build on them." };
    }
    if (big - small === 1 && small >= 3) {
      return { model: nearDouble(small),
        say: `Doubles plus one: ${small} + ${small} + 1 = ${end(ans)}`,
        grownups: `Near doubles: kids use a double they know (${small} + ${small}) and add 1.` };
    }
    const need = 10 - big, rest = small - need;
    return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(big, C.a).concat(fill(need, C.b))) + tenFrame(FRAME_W + 10, 0, fill(rest, C.b)), `make 10: ${big} and ${need}, then ${rest} more`),
      say: `Make 10: ${big} + ${need} + ${rest} = 10 + ${rest} = ${end(ans)}`,
      grownups: `Make 10: kids split the ${small} into ${need} + ${rest}, so ${big} becomes an easy 10.` };
  }
  if (op === "-") {
    if (x <= 10) {
      return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(x, C.a), x - y), `${x} dots, take away ${y}`),
        say: `Take away ${y}. How many are left? ${x} − ${y} = ${end(ans)}`,
        grownups: "Draw and cross out: kids draw the dots, cross out the ones taken away, and count what's left." };
    }
    // A teen number is 10 and some more (20 is 10 and 10). Which strategy depends on the numbers:
    // take away from the ones when they're enough (15 − 3), take away the 10 (14 − 10), count
    // back to 10 when taking a little crosses it (13 − 4), doubles for a double (16 − 8), and
    // think addition when the numbers are close, so the answer is smaller than what's taken away
    // (12 − 8, 17 − 15). The school's curriculum guides (Missouri) name all four.
    const more = x - 10, frames = (crossOnes, crossTen) => svg(FRAME_W * 2 + 10, FRAME_H,
      tenFrame(0, 0, fill(10, C.a), crossTen) + tenFrame(FRAME_W + 10, 0, fill(more, C.a), crossOnes), `${x} in ten-frames, take away ${y}`);
    const teenWhy = "10 and some more, taking away: a teen number is a full ten-frame and some more. When there are enough ones (15 − 3), kids take away from the ones and the 10 stays; 14 − 10 takes away the full ten.";
    if (y <= more) {
      if (y === more) return { model: frames(0), say: `${x} is 10 and ${more}. Take away the ${more}. ${x} − ${y} = ${end(ans)}`, grownups: teenWhy };
      return { model: frames(more - y), say: `${more === 10 ? x + " is 10 and 10. " : ""}Take ${y} from the ${more}: ${more} − ${y} = ${more - y}. 10 + ${more - y} = ${end(ans)}`, grownups: teenWhy };
    }
    if (y === 10) return { model: frames(null, 0), say: `${x} is a full ten and some more. Take away the ten. ${x} − ${y} = ${end(ans)}`, grownups: teenWhy };
    // A double: 16 − 8 is half of 16, since 8 + 8 = 16.
    if (ans === y) {
      return { model: doubleRows(y),
        say: `Doubles: ${y} + ${y} = ${x}, so ${x} − ${y} = ${end(ans)}`,
        grownups: "Doubles to subtract: kids use what they know about addition. 8 + 8 = 16, so 16 − 8 takes away one row and leaves the other 8." };
    }
    if (ans > y) {
      return { model: hops(x, ans, 10, worked),
        say: `Back to 10, then back ${y - more} more: ${x} − ${more} = 10. 10 − ${y - more} = ${end(ans)}`,
        grownups: "Count back through 10: taking a small number away, kids hop back on a number line to 10 first, then the rest. 13 − 4 is back 3 to 10, then back 1 more. When the numbers are close (12 − 8), counting up is quicker, so the hint thinks addition instead." };
    }
    return { model: hops(y, x, 10, worked),
      say: `Think addition: count up from ${y} to ${x}. ${x} − ${y} = ${end(ans)}`,
      grownups: `Think addition: when the numbers are close, kids find how far it is from ${y} up to ${x}, often hopping to 10 first. Taking a small number away (13 − 4), they count back instead.` };
  }
  if (op === "×") {
    const rows = Math.min(x, y), cols = Math.max(x, y);
    // × 1 is one group: 1 × 7 is 7.
    if (rows === 1) return { model: oneGroup(cols), say: `1 group: all ${cols} in it. ${x} × ${y} = ${end(ans)}`,
      grownups: "Times one: one group of 7 is just 7." };
    // × 10 is groups of ten: 7 × 10 is 7 tens (base-ten rods), not a break apart at 5.
    if (x === 10 || y === 10) {
      const n = x === 10 ? y : x, rods = blocks(n * 10, 4, C.a);
      return { model: svg(rods.w + 8, 58, rods.s, `${n} tens`),
        say: `Count by tens: ${n} ${n === 1 ? "ten" : "tens"}${worked ? " is " + ans : ""}. ${x} × ${y} = ${end(ans)}`,
        grownups: "Tens: × 10 makes groups of ten, so 7 × 10 is 7 tens, 70, the same as the base-ten rods. It's place value, not \"add a zero\"." };
    }
    // × 11 and × 12 break apart at 10: 12 × 6 is 6 × 10 + 6 × 2.
    // × 11 and × 12 break apart at 10: 12 × 6 is 6 × 10 + 6 × 2. Drawn as the area model, a
    // block of 10 and a small block, since an array of 144 dots shrinks to nothing on a phone.
    if (cols > 10) {
      const extra = cols - 10;
      return { model: areaSplit(rows, extra),
        say: `Break apart: ${rows} × 10 + ${rows} × ${extra} = ${rows * 10} + ${rows * extra} = ${end(ans)}`,
        grownups: `Break apart at 10 (the distributive property): the rectangle splits into a ${rows} × 10 and a ${rows} × ${extra}. × 11 is × 10 and one more group, and × 12 is × 10 and × 2.` };
    }
    // × 2 is a double: 8 × 2 is 8 + 8.
    if (rows === 2) {
      return { model: array(2, cols),
        say: `Doubles: 2 × ${cols} is ${cols} + ${cols} = ${end(ans)}`,
        grownups: "Doubles: × 2 is two equal rows, so 2 × 8 is the double 8 + 8, a fact kids already know from adding." };
    }
    // × 5 counts by 5s: 5, 10, 15, …
    if (rows === 5 || cols === 5) {
      const n = x === 5 ? y : x;
      return { model: fives(n, worked),
        say: `Count by 5s: 5, 10, … ${worked ? ans + ". " : ""}${x} × ${y} = ${end(ans)}`,
        grownups: "Count by 5s: × 5 is skip counting, 5, 10, 15, 20 … the way kids count nickels and tally marks." };
    }
    // × 3 is × 2 and one more group (3 × 7 = 2 × 7 + 7), and × 6 is × 5 and one more group
    // (6 × 7 = 5 × 7 + 7): each builds on a fact learned before it.
    const a = rows === 3 && cols >= 6 ? 3 : (x === 6 || y === 6) && cols <= 8 && rows >= 6 ? 6 : 0;
    if (a) {
      const b = x === a ? y : x, p = (a - 1) * b;
      return { model: array(a, b, { rowSplit: a - 1 }),
        say: `${a - 1} × ${b} = ${p}. One more ${b}: ${p} + ${b} = ${end(ans)}`,
        grownups: `One more group: × 3 is × 2 and one more group, and × 6 is × 5 and one more group, so ${a} × ${b} is ${a - 1} × ${b} = ${p}, plus ${b}.` };
    }
    if (cols === 9 && rows >= 3) {
      return { model: array(rows, 10, { split: 9 }),
        say: `${rows} × 9 is ${rows} × 10, minus one group of ${rows}: ${rows * 10} − ${rows} = ${end(ans)}`,
        grownups: "Nines as tens minus one: 9 × 7 is 10 × 7 = 70, take away one 7. (The standards teach this, not the finger trick.)" };
    }
    // Doubling: ×4 is double ×2, and ×8 is double ×4. The array is split down the middle. Small ×4
    // facts (× 3 and × 4) stay as plain arrays, the first model for ×.
    const d = x === 8 || y === 8 ? 8 : x === 4 || y === 4 ? 4 : 0, other = d && ans / d;
    if (d && other <= 10 && (other >= 5 || d === 8)) {
      const half = (d / 2) * other;
      return { model: d > other ? array(other, d, { split: d / 2 }) : array(d, other, { rowSplit: d / 2 }),
        say: `Double it: ${d} × ${other} is double ${d / 2} × ${other}. ${half} + ${half} = ${end(ans)}`,
        grownups: `Doubling: × 4 is double × 2, and × 8 is double × 4, so kids build on facts they already know. ${d} × ${other} is two groups of ${d / 2} × ${other} = ${half}.` };
    }
    if (rows >= 6 && cols > 5) {
      return { model: array(rows, cols, { split: 5 }),
        say: `Break apart: ${rows} × 5 + ${rows} × ${cols - 5} = ${rows * 5} + ${rows * (cols - 5)} = ${end(ans)}`,
        grownups: `Break apart (the distributive property): the array is a rectangle, split into two smaller ones kids know, ${rows} × 5 and ${rows} × ${cols - 5}. Add the two areas.` };
    }
    return { model: array(rows, cols),
      say: `${rows} rows of ${cols}. ${x} × ${y} = ${end(ans)}`,
      grownups: "Arrays: rows of dots show multiplication as equal groups. Turnarounds (3 × 4 = 4 × 3) halve what to learn." };
  }
  // ÷ 1 is one group: all of them in it.
  if (y === 1) return { model: oneGroup(x), say: `1 group: all ${x} in it. ${x} ÷ ${y} = ${end(ans)}`,
    grownups: "Dividing by one: sharing into one group puts them all in it, so 7 ÷ 1 is 7." };
  const say = `Think multiplication: how many ${y}s make ${x}? ${x} ÷ ${y} = ${end(ans)}`;
  const grownups = `Division as a missing factor: ${x} ÷ ${y} asks how many groups of ${y} make ${x}, the same as ${y} × ? = ${x}.`;
  // ÷ 11 and 12 (or an answer past 10): the area model, with the missing side to find.
  if (y > 10 || ans > 10) return { model: areaDiv(x, y, ans, worked), say, grownups };
  // Otherwise the array of x in groups of y, each group ringed, laid out wide: groups as columns
  // when there are more groups than in each.
  const label = `${x} in groups of ${y}`;
  return { model: ans > y ? array(y, ans, { groups: "cols", label }) : array(ans, y, { groups: "rows", label }), say, grownups };
}

// The strategies, one sample problem each, for the "How the hints work" page in Settings, where
// the grown-ups lines live (the hints in play show only the drawing and its words).
export const STRATEGIES = [
  { title: "How many at a glance", grade: "K", f: flashFactOf("⁙d5") },
  { title: "Five-frames", grade: "K", f: flashFactOf("⁙f4") },
  { title: "Dominoes", grade: "K", f: flashFactOf("⁙o3,2") },
  { title: "Ten-frame", grade: "K", f: { op: "+", x: 3, y: 4 } },
  { title: "Adding zero", grade: "K", f: { op: "+", x: 4, y: 0 } },
  { title: "Which is more", grade: "K", f: moreFact(7, 4) },
  { title: "Make 10 partners", grade: "K", f: hiddenFact("+", 7, 3) },
  { title: "Number bonds", grade: "K", f: hiddenFact("+", 4, 2) },
  { title: "The missing number", grade: "1st", f: hiddenFact("+", 7, 8) },
  { title: "Draw and cross out", grade: "K", f: { op: "-", x: 9, y: 4 } },
  { title: "10 and some more", grade: "K–1st", f: { op: "+", x: 10, y: 4 } },
  { title: "Make 10", grade: "1st", f: { op: "+", x: 8, y: 5 } },
  { title: "Doubles", grade: "1st", f: { op: "+", x: 8, y: 8 } },
  { title: "Doubles plus one", grade: "1st", f: { op: "+", x: 6, y: 7 } },
  { title: "Three numbers: find the ten", grade: "1st", f: threeFact(4, 3, 6) },
  { title: "Take away from 10 and some more", grade: "1st", f: { op: "-", x: 15, y: 3 } },
  { title: "Count back through 10", grade: "1st", f: { op: "-", x: 13, y: 4 } },
  { title: "Doubles to subtract", grade: "1st", f: { op: "-", x: 16, y: 8 } },
  { title: "Think addition", grade: "1st", f: { op: "-", x: 12, y: 8 } },
  { title: "Arrays", grade: "2nd–3rd", f: { op: "×", x: 3, y: 4 } },
  { title: "Times 2 as doubles", grade: "2nd–3rd", f: { op: "×", x: 8, y: 2 } },
  { title: "Count by 5s", grade: "3rd", f: { op: "×", x: 5, y: 7 } },
  { title: "Times 10 as tens", grade: "3rd", f: { op: "×", x: 7, y: 10 } },
  { title: "Doubling", grade: "3rd", f: { op: "×", x: 4, y: 7 } },
  { title: "One more group", grade: "3rd", f: { op: "×", x: 6, y: 7 } },
  { title: "Break apart", grade: "3rd", f: { op: "×", x: 7, y: 7 } },
  { title: "Nines as tens", grade: "3rd", f: { op: "×", x: 9, y: 7 } },
  { title: "Elevens and twelves", grade: "3rd–4th", f: { op: "×", x: 12, y: 6 } },
  { title: "Naming coins", grade: "K", f: findFact("q", { q: 2, d: 1, n: 1, p: 0 }) },
  { title: "What each coin is worth", grade: "K", f: coinFact({ q: 0, d: 1, n: 0, p: 0 }, true) },
  { title: "Counting coins", grade: "1st", f: coinFact({ q: 0, d: 1, n: 1, p: 2 }) },
  { title: "Arrays as equal rows", grade: "2nd", f: arrayFact(3, 5) },
  { title: "Count on", grade: "K", f: patternFact("ones", [4, 5, 6, 7], 3) },
  { title: "Count back", grade: "K", f: patternFact("back", [10, 9, 8, 7], 3) },
  { title: "Skip counting", grade: "1st–2nd", f: patternFact("fives", [15, 20, 25, 30, 35], 4) },
  { title: "What's missing", grade: "2nd", f: patternFact("middle", [20, 30, 40, 50], 1) },
  { title: "Odd and even", grade: "2nd", f: oddEvenFact("oddeven20", "even", [3, 8, 11, 14, 6], 20) },
  { title: "Telling the hour", grade: "1st", f: clockFact("hours", "hour", 3, 0) },
  { title: "Half past", grade: "1st", f: clockFact("half", "hour", 3, 30) },
  { title: "Writing the time", grade: "1st–2nd", f: clockFact("fivetime", "time", 4, 25) },
  { title: "Minutes by 5s", grade: "2nd", f: clockFact("five", "minutes", 3, 35) },
  { title: "To the minute", grade: "3rd", f: clockFact("minute", "minutes", 3, 37) },
  { title: "How long? Round the clock", grade: "3rd", f: clockFact("longA", "long", 3, 10, { d: 35 }) },
  { title: "How long? An open number line", grade: "3rd", f: clockFact("longB", "long", 3, 50, { d: 35 }) },
  { title: "Minutes later", grade: "3rd", f: clockFact("addB", "add", 3, 50, { d: 25 }) },
  { title: "Tens and ones", grade: "2nd", f: { op: "+", x: 38, y: 25 } },
  { title: "Take away tens and ones", grade: "2nd", f: { op: "-", x: 69, y: 26 } },
  { title: "Back to a ten", grade: "2nd", f: { op: "-", x: 52, y: 7 } },
  { title: "Count up by tens", grade: "2nd", f: { op: "-", x: 52, y: 28 } },
  { title: "10 and 100 more", grade: "2nd", f: { op: "+", x: 345, y: 100 } },
  { title: "Add each place", grade: "2nd–3rd", f: { op: "+", x: 287, y: 359, ans: 646 } },
  { title: "Take away each place", grade: "2nd–3rd", f: { op: "-", x: 821, y: 511, ans: 310 } },
  { title: "Count up to subtract", grade: "2nd–3rd", f: { op: "-", x: 403, y: 158, ans: 245 } },
  { title: "Compare hundreds, tens, ones", grade: "2nd", f: { op: "○", l: "345", r: "354", sym: "<", ans: 354, q: "345 □ 354" } },
  { title: "Adding up to four numbers", grade: "2nd", f: sumFact([23, 14, 31, 17]) },
  { title: "Compare", grade: "K–1st", f: { op: "○", l: "3 + 4", r: "8", sym: "<", ans: 8, q: "3 + 4 □ 8" } },
  { title: "Balance", grade: "1st", f: { op: "=", l: "3 + 4", r: "□ + 5", ans: 2, q: "3 + 4 = □ + 5" } },
  { title: "Think multiplication", grade: "3rd", f: { op: "÷", x: 32, y: 8 } },
  { title: "Times zero", grade: "3rd", f: { op: "×", x: 0, y: 7 } },
  { title: "Times tens", grade: "3rd", f: { op: "×", x: 4, y: 30 } },
  { title: "True or false?", grade: "1st", f: tfFactOf("✓4+2=7") },
  { title: "Fix it", grade: "1st", f: tfFactOf("✎4+2=7") },
  { title: "Hundreds, tens and ones", grade: "2nd", f: pvFactOf("#b345") },
  { title: "Tens in a number", grade: "2nd", f: pvFactOf("#o34,3") },
  { title: "Counting dollars", grade: "2nd", f: dollarFactOf("$20,5,1") },
  { title: "Dollars and cents", grade: "2nd", f: dollarFactOf("$10,1+1,1,0,2") },
  { title: "Fractions on a number line", grade: "3rd", f: lineFactOf("↔3/4") },
  { title: "Equal parts", grade: "3rd", f: lineFactOf("↔p4") },
  { title: "Drawing shapes", grade: "K–3rd", f: shapeFactOf("◇draw:tri") },
  { title: "Counting sides", grade: "K–2nd", f: shapeFactOf("◇sides:hex", () => 0) },
  { title: "Faces of a cube", grade: "2nd", f: shapeFactOf("◇faces:cube") },
  { title: "Equal shares", grade: "1st–2nd", f: shapeFactOf("◇parts:rect4g") },
  { title: "Rows and columns of squares", grade: "2nd", f: shapeFactOf("◇squares:3,4") },
  { title: "Unit fractions", grade: "3rd", f: shapeFactOf("◇unit:circle4") },
  { title: "Equal fractions", grade: "3rd", f: fractionFact(1, 2, 4) },
  { title: "Compare fractions: same size pieces", grade: "3rd", f: fracCompareFact("3/8", "5/8") },
  { title: "Compare fractions: same number of pieces", grade: "3rd", f: fracCompareFact("2/3", "2/6") },
  { title: "Tally charts", grade: "1st", f: chartFactOf("▥T1:torch5,potion7,key3:n.potion") },
  { title: "How many more on a chart", grade: "1st–2nd", f: chartFactOf("▥T1:torch5,potion7,key3:m.potion.key") },
  { title: "Bar graphs", grade: "2nd–3rd", f: chartFactOf("▥B5:torch10,potion25:f.torch.potion") },
  { title: "Line plots: the mode", grade: "4th", f: chartFactOf("▥F:potion:1x2,3x4,4x1:mo") },
  { title: "Longer or shorter", grade: "K", f: lengthGameFactOf("ℓc:pencil8,toothbrush6") },
  { title: "Measuring with cubes", grade: "1st", f: lengthGameFactOf("ℓu:cube,marker5") },
  { title: "Inches on a ruler", grade: "2nd", f: lengthGameFactOf("ℓin:pencil7") },
  { title: "Not from 0", grade: "2nd", f: lengthGameFactOf("ℓin:toothbrush1-6") },
  { title: "Rounding", grade: "3rd", f: roundFact(47, 10) },
  { title: "Area", grade: "3rd", f: rectFact("a", 4, 3) },
  { title: "Perimeter", grade: "3rd", f: rectFact("p", 4, 3) }
].map((s) => Object.assign(s, { f: Object.assign({ ans: { "+": s.f.x + s.f.y, "-": s.f.x - s.f.y, "×": s.f.x * s.f.y, "÷": s.f.x / s.f.y }[s.f.op] }, s.f) }));

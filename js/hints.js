import { coinsSvg, coinFact, findFact, coinOf, pileOf, COINS } from "./coins.js";

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

// Rows × cols of dots; split: a gap after that many columns (break apart).
function array(rows, cols, split) {
  const gx = split ? 10 : 0, w = cols * 14 + gx + 4, h = rows * 14 + 4;
  let s = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = 9 + c * 14 + (split && c >= split ? gx : 0), y = 9 + r * 14;
    s += `<circle cx="${x}" cy="${y}" r="5" fill="${split && c >= split ? C.b : C.a}"/>`;
  }
  return svg(w, h, s, `${rows} ${rows === 1 ? "row" : "rows"} of ${cols}`);
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
// or counting back to 10 (or to a ten) when b < a.
function hops(a, b, via) {
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
    s += `<line x1="${x(n)}" y1="38" x2="${x(n)}" y2="50" stroke="${C.ink}" stroke-width="2.5"/><text x="${x(n)}" y="66" text-anchor="middle" fill="${C.ink}" font-size="14" font-weight="800">${n}</text>`;
    if (i) {
      const p = stops[i - 1], mid = (x(p) + x(n)) / 2;
      const col = i % 2 ? C.a : C.b;
      // An arrowhead where the hop lands, so counting back reads right to left.
      const dir = n > p ? -1 : 1;
      s += `<path d="M${x(p)} 38 Q${mid} 6 ${x(n)} 38" fill="none" stroke="${col}" stroke-width="3"/><path d="M${x(n) + dir * 7} 28 L${x(n)} 38 L${x(n) + dir * 9} 35" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="${mid}" y="16" text-anchor="middle" fill="${col}" font-size="13" font-weight="900">${back ? "−" : "+"}${Math.abs(n - p)}</text>`;
    }
  });
  return svg(W, 72, s, `count ${back ? "back" : "up"} from ${a} to ${b}`);
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
  let run = 0;
  const steps = vals.map((v) => (run += v));
  const say = vals.every((v) => v === 1)
    ? `Count the pennies, 1 cent each: ${f.q} = ${end}`
    : `Count on from the biggest coin${worked ? ": " + steps.join(", ") + "." : ":"} ${f.q} = ${end}`;
  return { model: coinsSvg(f.pile || f.coins, { labels: true }), say, grownups };
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
  // The ones are enough: take away the tens, then the ones, from the blocks.
  if (ones(x) >= ones(y)) {
    const a = blocks(x, 4, C.a, (tens(x) - tens(y)) / 10, ones(x) - ones(y));
    const model = svg(a.w + 8, 58, a.s, `${x} in tens and ones, take away ${y}`);
    const grownups = "Take away tens and ones: when there are enough ones, kids cross out the tens and ones being taken away, so 69 − 26 is 60 − 20 = 40 and 9 − 6 = 3.";
    const t = tens(x) - tens(y), o = ones(x) - ones(y);
    if (!t) return { model, say: `Both have ${T(tens(x))}, so take them away. ${ones(x)} − ${ones(y)} = ${end}`, grownups };
    if (!tens(y)) return { model, say: `${x} is ${T(tens(x))} and ${ones(x)} ones. Take away ${y} ones: ${ones(x)} − ${y} = ${o}. ${t} + ${o} = ${end}`, grownups };
    if (!ones(y)) return { model, say: `Take away ${T(y)}: ${tens(x)} − ${y} = ${t}. ${t} + ${o} = ${end}`, grownups };
    return { model, say: `Take away the tens, then the ones: ${tens(x)} − ${tens(y)} = ${t}, ${ones(x)} − ${ones(y)} = ${o}. ${t} + ${o} = ${end}`, grownups };
  }
  // A one-digit number that crosses a ten: back to the ten, then the rest (52 − 7: 52 − 2 = 50, then 5 more).
  if (y < 10) {
    const grownups = "Back to a ten: taking a small number away, kids count back on an open number line to the ten first, then the rest. 52 − 7 is 52 − 2 = 50, then 50 − 5.";
    if (!ones(x)) return { model: hops(x, ans, x - 10), say: `${x} is ${x - 10} and 10. Take ${y} from the 10: 10 − ${y} = ${10 - y}. ${x - 10} + ${10 - y} = ${end}`, grownups };
    const rest = y - ones(x);
    return { model: hops(x, ans, tens(x)), say: `Back to ${tens(x)}, then ${rest} more: ${x} − ${ones(x)} = ${tens(x)}. ${tens(x)} − ${rest} = ${end}`, grownups };
  }
  // Count up from y: to the next ten, then by tens, then the rest.
  const up = Math.ceil(y / 10) * 10, down = tens(x), stops = [y, up, down, x].filter((v, i, a) => a.indexOf(v) === i && v >= y && v <= x);
  const jumps = stops.slice(1).map((v, i) => v - stops[i]);
  return { model: hops(y, x, stops.slice(1, -1)),
    say: `Think addition: count up from ${y} to ${x}. ${jumps.join(" + ")} = ${end}`,
    grownups: "Think addition on an open number line: when it crosses a ten (52 − 28), kids count up from the smaller number, hopping to the next ten, then by tens, then the rest." };
}

// The Balance Hall (K–2nd). Comparing: line the dots up (to 10, and sums), or tens then ones (to
// 100). Balancing: both sides weigh the same, so work out the known side, then what's missing.
function dotRow(y, groups) {
  let s = "", i = 0;
  groups.forEach(([n, color]) => { for (let k = 0; k < n; k++, i++) s += `<circle cx="${12 + i * 17}" cy="${y}" r="6.5" fill="${color}"/>`; });
  return s;
}
const sideValue = (side) => side.split(" + ").reduce((t, n) => t + Number(n), 0);
function balanceHint(f, worked) {
  if (f.op === "○") {
    const lv = sideValue(f.l), rv = sideValue(f.r), end = worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r;
    const grownups = "Comparing: kids line up the dots (or compare tens, then ones) to see which is more. The open side of < and > faces the bigger number, like Chompers' mouth.";
    if (Math.max(lv, rv) <= 10) {
      const parts = f.l.split(" + ").map(Number), left = parts.length > 1 ? [[parts[0], C.a], [parts[1], C.b]] : [[lv, C.a]];
      const model = svg(12 + 10 * 17, 44, dotRow(12, left) + dotRow(32, [[rv, C.ink]]), `${lv} dots and ${rv} dots`);
      const sum = parts.length > 1 ? `${f.l} is ${lv}. ` : "";
      return { model, say: `${sum}Line them up: is one row longer, or are they the same? ${end}`, grownups };
    }
    const a = blocks(lv, 4, C.a), b = blocks(rv, 4 + a.w + 18, C.b);
    return { model: svg(a.w + b.w + 26, 58, a.s + b.s, `${lv} and ${rv} in tens and ones`),
      say: `Compare the tens first, then the ones. ${end}`, grownups };
  }
  // Balance: the side without the □ is the total.
  const known = f.l.includes("□") ? f.r : f.l, open = f.l.includes("□") ? f.l : f.r;
  const total = sideValue(known), other = sideValue(open.replace("□", "0")), end = worked ? f.ans : "?";
  const W = 260, beam = `<path d="M130 70 L118 92 H142 Z" fill="${C.muted}"/><line x1="20" y1="70" x2="240" y2="70" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
  const pan = (cx, groups, box) => {
    let s = `<path d="M${cx - 50} 64 Q${cx - 3} 78 ${cx + 44} 64" fill="none" stroke="${C.muted}" stroke-width="3" stroke-linecap="round"/>`, i = 0;
    groups.forEach(([n, color]) => { for (let k = 0; k < n; k++, i++) s += `<circle cx="${cx - 40 + (i % 5) * 16}" cy="${56 - Math.floor(i / 5) * 15}" r="6" fill="${color}"/>`; });
    if (box) s += `<rect x="${cx - 40 + (i % 5) * 16 - 7}" y="${49 - Math.floor(i / 5) * 15}" width="14" height="14" rx="3" fill="none" stroke="${C.a}" stroke-width="2" stroke-dasharray="3 2"/>`;
    return s;
  };
  const kParts = known.split(" + ").map(Number), groups = kParts.length > 1 ? [[kParts[0], C.a], [kParts[1], C.b]] : [[total, C.a]];
  const model = svg(W, 96, beam + pan(f.l.includes("□") ? 195 : 65, groups) + pan(f.l.includes("□") ? 65 : 195, [[other, C.ink]], true), `a balance: ${f.q}`);
  const first = kParts.length > 1 ? `${known} = ${total}, so ` : "";
  return { model, say: `Both sides are the same. ${first}${open} = ${total}. ${total} − ${other} = ${end}`,
    grownups: "The equal sign means both sides are the same amount, not \"the answer comes next\". Kids work out the side they know, then find what makes the other side match." };
}

export function hintFor(f, worked) {
  if (f.op === "¢") return coinHint(f, worked);
  if (f.op === "○" || f.op === "=") return balanceHint(f, worked);
  if ((f.op === "+" && f.ans > 20) || (f.op === "-" && f.x > 20)) return twoDigitHint(f, worked);
  const { op, x, y, ans } = f, end = (t) => (worked ? t : "?");
  if (op === "+") {
    const big = Math.max(x, y), small = Math.min(x, y);
    if (ans <= 10) {
      return { model: svg(FRAME_W, FRAME_H, tenFrame(0, 0, fill(x, C.a).concat(fill(y, C.b))), `ten-frame: ${x} and ${y}`),
        say: `Put together ${x} and ${y}. ${x} + ${y} = ${end(ans)}`,
        grownups: "Ten-frame: kids count the dots, and learn to see 5 and some more without counting." };
    }
    if (big === 10) {
      return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(10, C.a)) + tenFrame(FRAME_W + 10, 0, fill(small, C.b)), `10 and ${small} more`),
        say: `10 and some more: 10 + ${small} = ${end(ans)}`,
        grownups: "Teen numbers as 10 and some more: 14 is a full ten-frame and 4 more." };
    }
    if (big > 10) {
      const ones = big - 10;
      return { model: svg(FRAME_W * 2 + 10, FRAME_H, tenFrame(0, 0, fill(10, C.a)) + tenFrame(FRAME_W + 10, 0, fill(ones, C.a).concat(fill(small, C.b))), `${big} is 10 and ${ones}, then ${small} more`),
        say: `10 and some more: ${big} is 10 + ${ones}. 10 + ${ones} + ${small} = ${end(ans)}`,
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
    // back to 10 when taking a little crosses it (13 − 4), and think addition when the numbers
    // are close, so the answer is no bigger than what's taken away (12 − 8, 17 − 15).
    const more = x - 10, frames = (crossOnes, crossTen) => svg(FRAME_W * 2 + 10, FRAME_H,
      tenFrame(0, 0, fill(10, C.a), crossTen) + tenFrame(FRAME_W + 10, 0, fill(more, C.a), crossOnes), `${x} is 10 and ${more}, take away ${y}`);
    const teenWhy = "10 and some more, taking away: a teen number is a full ten-frame and some more. When there are enough ones (15 − 3), kids take away from the ones and the 10 stays; 14 − 10 takes away the full ten.";
    if (y <= more) {
      if (y === more) return { model: frames(0), say: `${x} is 10 and ${more}. Take away the ${more}. ${x} − ${y} = ${end(ans)}`, grownups: teenWhy };
      return { model: frames(more - y), say: `${x} is 10 and ${more}. Take away ${y} from the ${more}: ${more} − ${y} = ${more - y}. 10 + ${more - y} = ${end(ans)}`, grownups: teenWhy };
    }
    if (y === 10) return { model: frames(null, 0), say: `${x} is 10 and ${more}. Take away the 10. ${x} − ${y} = ${end(ans)}`, grownups: teenWhy };
    if (ans > y) {
      return { model: hops(x, ans, 10),
        say: `Count back to 10, then the rest: ${x} − ${more} = 10. 10 − ${y - more} = ${end(ans)}`,
        grownups: "Count back through 10: taking a small number away, kids hop back on a number line to 10 first, then the rest. 13 − 4 is back 3 to 10, then back 1 more. When the numbers are close (12 − 8), counting up is quicker, so the hint thinks addition instead." };
    }
    return { model: hops(y, x, 10),
      say: `Think addition: ${y} + ? = ${x}. Count up${y < 10 ? " through 10" : ""}: ${x} − ${y} = ${end(ans)}`,
      grownups: `Think addition: when the numbers are close, kids find how far it is from ${y} up to ${x}, often hopping to 10 first. Taking a small number away (13 − 4), they count back instead.` };
  }
  if (op === "×") {
    const rows = Math.min(x, y), cols = Math.max(x, y);
    // × 10 is groups of ten: 7 × 10 is 7 tens (base-ten rods), not a break apart at 5.
    if (x === 10 || y === 10) {
      const n = x === 10 ? y : x, rods = blocks(n * 10, 4, C.a);
      return { model: svg(rods.w + 8, 58, rods.s, `${n} tens`),
        say: `Count by tens: ${n} ${n === 1 ? "ten" : "tens"}${worked ? " is " + ans : ""}. ${x} × ${y} = ${end(ans)}`,
        grownups: "Tens: × 10 makes groups of ten, so 7 × 10 is 7 tens, 70, the same as the base-ten rods. It's place value, not \"add a zero\"." };
    }
    // × 11 and × 12 break apart at 10: 12 × 6 is 6 × 10 + 6 × 2.
    if (cols > 10) {
      const extra = cols - 10;
      return { model: array(rows, cols, 10),
        say: `Break apart: ${rows} × 10 + ${rows} × ${extra} = ${rows * 10} + ${rows * extra} = ${end(ans)}`,
        grownups: `Break apart at 10: × 11 is × 10 and one more group, and × 12 is × 10 and × 2, so ${rows} × ${cols} is ${rows} × 10 + ${rows} × ${extra}.` };
    }
    if (cols === 9 && rows >= 3) {
      return { model: array(rows, 10, 9),
        say: `${rows} × 9 is ${rows} × 10, minus one group of ${rows}: ${rows * 10} − ${rows} = ${end(ans)}`,
        grownups: "Nines as tens minus one: 9 × 7 is 10 × 7 = 70, take away one 7. (The standards teach this, not the finger trick.)" };
    }
    // × 2 is a double: 8 × 2 is 8 + 8.
    if (rows === 2) {
      return { model: array(2, cols, 0),
        say: `Doubles: 2 × ${cols} is ${cols} + ${cols} = ${end(ans)}`,
        grownups: "Doubles: × 2 is two equal rows, so 2 × 8 is the double 8 + 8, a fact kids already know from adding." };
    }
    // Doubling: ×4 is double ×2, and ×8 is double ×4. The array is split down the middle. Small ×4
    // facts (× 3 and × 4) stay as plain arrays, the first model for ×.
    const d = x === 8 || y === 8 ? 8 : x === 4 || y === 4 ? 4 : 0, other = d && ans / d;
    if (d && other <= 10 && (other >= 5 || d === 8)) {
      const half = (d / 2) * other;
      return { model: array(other, d, d / 2),
        say: `Double it: ${d} × ${other} is double ${d / 2} × ${other}. ${half} + ${half} = ${end(ans)}`,
        grownups: `Doubling: × 4 is double × 2, and × 8 is double × 4, so kids build on facts they already know. ${d} × ${other} is two groups of ${d / 2} × ${other} = ${half}.` };
    }
    if (rows >= 6 && cols > 5) {
      return { model: array(rows, cols, 5),
        say: `Break apart: ${rows} × 5 + ${rows} × ${cols - 5} = ${rows * 5} + ${rows * (cols - 5)} = ${end(ans)}`,
        grownups: `Break apart (the distributive property): ${rows} × ${cols} splits into facts kids know, ${rows} × 5 and ${rows} × ${cols - 5}.` };
    }
    return { model: array(rows, cols, 0),
      say: `${rows} rows of ${cols}. ${x} × ${y} = ${end(ans)}`,
      grownups: "Arrays: rows of dots show multiplication as equal groups. Turnarounds (3 × 4 = 4 × 3) halve what to learn." };
  }
  // ÷: think multiplication, with the array of x in rows of y.
  return { model: array(Math.min(ans, 12), y, 0),
    say: `Think multiplication: ${y} × ? = ${x}. ${x} ÷ ${y} = ${end(ans)}`,
    grownups: `Division as a missing factor: ${x} ÷ ${y} asks how many groups of ${y} make ${x}.` };
}

// The strategies, one sample problem each, for the "How the hints work" page in Settings, where
// the grown-ups lines live (the hints in play show only the drawing and its words).
export const STRATEGIES = [
  { title: "Ten-frame", grade: "K", f: { op: "+", x: 3, y: 4 } },
  { title: "Draw and cross out", grade: "K", f: { op: "-", x: 9, y: 4 } },
  { title: "10 and some more", grade: "K–1st", f: { op: "+", x: 10, y: 4 } },
  { title: "Make 10", grade: "1st", f: { op: "+", x: 8, y: 5 } },
  { title: "Doubles", grade: "1st", f: { op: "+", x: 8, y: 8 } },
  { title: "Doubles plus one", grade: "1st", f: { op: "+", x: 6, y: 7 } },
  { title: "Take away from 10 and some more", grade: "1st", f: { op: "-", x: 15, y: 3 } },
  { title: "Count back through 10", grade: "1st", f: { op: "-", x: 13, y: 4 } },
  { title: "Think addition", grade: "1st", f: { op: "-", x: 12, y: 8 } },
  { title: "Arrays", grade: "2nd–3rd", f: { op: "×", x: 3, y: 4 } },
  { title: "Times 2 as doubles", grade: "2nd–3rd", f: { op: "×", x: 8, y: 2 } },
  { title: "Times 10 as tens", grade: "3rd", f: { op: "×", x: 7, y: 10 } },
  { title: "Doubling", grade: "3rd", f: { op: "×", x: 4, y: 7 } },
  { title: "Break apart", grade: "3rd", f: { op: "×", x: 6, y: 7 } },
  { title: "Nines as tens", grade: "3rd", f: { op: "×", x: 9, y: 7 } },
  { title: "Elevens and twelves", grade: "3rd–4th", f: { op: "×", x: 12, y: 6 } },
  { title: "Naming coins", grade: "K", f: findFact("q", { q: 2, d: 1, n: 1, p: 0 }) },
  { title: "What each coin is worth", grade: "K", f: coinFact({ q: 0, d: 1, n: 0, p: 0 }, true) },
  { title: "Counting coins", grade: "1st", f: coinFact({ q: 0, d: 1, n: 1, p: 2 }) },
  { title: "Tens and ones", grade: "2nd", f: { op: "+", x: 38, y: 25 } },
  { title: "Take away tens and ones", grade: "2nd", f: { op: "-", x: 69, y: 26 } },
  { title: "Back to a ten", grade: "2nd", f: { op: "-", x: 52, y: 7 } },
  { title: "Count up by tens", grade: "2nd", f: { op: "-", x: 52, y: 28 } },
  { title: "Compare", grade: "K–1st", f: { op: "○", l: "3 + 4", r: "8", sym: "<", ans: 8, q: "3 + 4 □ 8" } },
  { title: "Balance", grade: "1st", f: { op: "=", l: "3 + 4", r: "□ + 5", ans: 2, q: "3 + 4 = □ + 5" } },
  { title: "Think multiplication", grade: "3rd", f: { op: "÷", x: 32, y: 8 } }
].map((s) => Object.assign(s, { f: Object.assign({ ans: { "+": s.f.x + s.f.y, "-": s.f.x - s.f.y, "×": s.f.x * s.f.y, "÷": s.f.x / s.f.y }[s.f.op] }, s.f) }));

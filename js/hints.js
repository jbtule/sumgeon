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
  return svg(w, h, s, `${rows} rows of ${cols}`);
}

// A double (two rows of n) and one more dot.
function nearDouble(n) {
  let s = "";
  for (let r = 0; r < 2; r++) for (let c = 0; c < n; c++) s += `<circle cx="${9 + c * 14}" cy="${9 + r * 14}" r="5" fill="${C.a}"/>`;
  s += `<circle cx="${9 + n * 14}" cy="23" r="5" fill="${C.b}"/>`;
  return svg((n + 1) * 14 + 4, 32, s, `${n} and ${n}, and 1 more`);
}

// An open number line from a to b, hopping to `via` first (count up through 10).
function hops(a, b, via) {
  const stops = via && via > a && via < b ? [a, via, b] : [a, b];
  const W = 260, x = (n) => 14 + (n - a) / (b - a) * (W - 28);
  let s = `<line x1="8" y1="44" x2="${W - 8}" y2="44" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
  stops.forEach((n, i) => {
    s += `<line x1="${x(n)}" y1="38" x2="${x(n)}" y2="50" stroke="${C.ink}" stroke-width="2.5"/><text x="${x(n)}" y="66" text-anchor="middle" fill="${C.ink}" font-size="14" font-weight="800">${n}</text>`;
    if (i) {
      const p = stops[i - 1], mid = (x(p) + x(n)) / 2;
      s += `<path d="M${x(p)} 38 Q${mid} 6 ${x(n)} 38" fill="none" stroke="${i === 1 ? C.a : C.b}" stroke-width="3"/><text x="${mid}" y="16" text-anchor="middle" fill="${i === 1 ? C.a : C.b}" font-size="13" font-weight="900">+${n - p}</text>`;
    }
  });
  return svg(W, 72, s, `count up from ${a} to ${b}`);
}

export function hintFor(f, worked) {
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
    return { model: hops(y, x, 10),
      say: `Think addition: ${y} + ? = ${x}. Count up${y < 10 ? " through 10" : ""}: ${x} − ${y} = ${end(ans)}`,
      grownups: `Think addition: kids find how far it is from ${y} up to ${x}, often hopping to 10 first.` };
  }
  if (op === "×") {
    const rows = Math.min(x, y), cols = Math.max(x, y);
    if (cols === 9 && rows >= 3) {
      return { model: array(rows, 10, 9),
        say: `${rows} × 9 is ${rows} × 10, minus one group of ${rows}: ${rows * 10} − ${rows} = ${end(ans)}`,
        grownups: "Nines as tens minus one: 9 × 7 is 10 × 7 = 70, take away one 7. (The standards teach this, not the finger trick.)" };
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

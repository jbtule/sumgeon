// 4th grade's hints (DESIGN.md §4.4, the Fraction Forge), in the school's 4th grade guide's models
// and words: the area model and partial products, partial quotients, equal groups and what's
// left, the standard algorithm in place-value words, fraction bars, a hundred grid, the conversion
// table, the protractor. Like hints.js (which sends 4th grade's facts here): { model, say,
// grownups }, the drawing an SVG string; worked false never shows the answer.
import { angleSvg, angleHint } from "./angles.js";
import { rectSvg } from "./third.js";
import { UNITS, factorPairs, moneyText4 } from "./fourth.js";

const C = { a: "var(--gold)", b: "var(--coral)", line: "var(--hint-line)", ink: "var(--ink)", muted: "var(--muted)", empty: "var(--hint-empty)" };
const SCALE = 1.5;
const f1 = (n) => Math.round(n * 10) / 10;
const svg = (w, h, body, label) => `<svg viewBox="0 0 ${f1(w)} ${f1(h)}" width="${f1(w * SCALE)}" height="${f1(h * SCALE)}" role="img" aria-label="${label}">${body}</svg>`;
const txt = (x, y, t, size, color, anchor) => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor || "middle"}" fill="${color || C.ink}" font-size="${size || 14}" font-weight="900">${t}</text>`;
// A drawing made elsewhere (angles.js, third.js), kept short: its own viewBox nested inside one
// no taller than maxH.
function fitted(inner, maxH, label) {
  const m = inner.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/), w = Number(m[3]), h = Number(m[4]), k = Math.min(1, maxH / h), W = f1(w * k), H = f1(h * k);
  const body = inner.replace(/^<svg[^>]*>/, `<svg x="0" y="0" width="${W}" height="${H}" viewBox="${m[1]} ${m[2]} ${w} ${h}" overflow="visible">`);
  return svg(W, H, body, label);
}
// A number's places, biggest first: 243 → [200, 40, 3] (no zeros).
const places = (n) => { const s = String(n); return [...s].map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean); };

/* ---------- multiplying (4.NBT.A.6) ---------- */
// × 10, 100, 1000: the one-digit fact, in tens, hundreds or thousands. 6 × 300 is 6 × 3 hundreds.
const PLACE = { 10: "tens", 100: "hundreds", 1000: "thousands" };
function timesPlaceHint(f, worked) {
  const [a, b] = [f.x, f.y].sort((p, q) => String(p).replace(/0+$/, "").length - String(q).replace(/0+$/, "").length || p - q);
  const zeros = (n) => (String(n).match(/0+$/) || [""])[0].length, za = zeros(a), zb = zeros(b), da = a / 10 ** za, db = b / 10 ** zb, z = za + zb, unit = 10 ** z;
  const end = worked ? f.ans : "?";
  // Tens × tens (40 × 70): 4 × 7 = 28, and tens × tens are hundreds.
  const say = za && zb
    ? `${da} × ${db} = ${da * db}. Tens × tens are hundreds: ${da * db} hundreds. ${f.x} × ${f.y} = ${end}`
    : `${da} × ${db} ${PLACE[unit] || ""} is ${da * db} ${PLACE[unit] || ""}. ${f.x} × ${f.y} = ${end}`;
  let s = txt(10, 22, `${da} × ${db}`, 18, C.a, "start") + txt(10, 48, `${da * db} ${PLACE[unit] || ""}`, 16, C.b, "start");
  const model = svg(150, 56, s, `${da} times ${db}, in ${PLACE[unit] || "ones"}`);
  return { model, say: say.replace(/\s+/g, " "), grownups: "Multiplying by 10, 100 and 1000: kids use the fact they know (6 × 3 = 18) and the place: 6 × 3 hundreds is 18 hundreds, 1800. It's place value, not \"add zeros\"." };
}
// The area model: a rectangle cut by place, each part's product in it, the parts added. 243 × 6
// is 200 × 6 + 40 × 6 + 3 × 6; 27 × 23 is four boxes. Before answering the parts but not their sum.
function areaModelHint(f, worked) {
  const big = Math.max(f.x, f.y), small = Math.min(f.x, f.y), cols = places(big), rows = small >= 10 ? places(small) : [small];
  const W = 220, x0 = 30, y0 = 18, rh = rows.length > 1 ? 26 : 40, widths = cols.map((c) => Math.max(34, W * c / big)), tot = widths.reduce((a, b) => a + b, 0), sc = W / tot;
  let s = "", x = x0;
  const parts = [];
  rows.forEach((r, j) => { x = x0; cols.forEach((c, i) => { const w = widths[i] * sc, y = y0 + j * rh; parts.push([c, r]);
    s += `<rect x="${f1(x)}" y="${y}" width="${f1(w)}" height="${rh}" fill="${(i + j) % 2 ? C.b : C.a}" fill-opacity=".25" stroke="${C.ink}" stroke-width="2"/>` + txt(x + w / 2, y + rh / 2 + 5, c * r, 12);
    if (!j) s += txt(x + w / 2, y0 - 5, c, 12, C.a); x += w; }); s += txt(x0 - 8, y0 + j * rh + rh / 2 + 5, r, 12, C.b, "end"); });
  const sum = parts.map(([c, r]) => c * r);
  const words = parts.map(([c, r]) => `${c} × ${r} = ${c * r}`).join(", ");
  const say = `Break it apart by place: ${words}. ${sum.join(" + ")} = ${worked ? f.ans : "?"}`;
  const model = svg(x0 + W + 8, y0 + rows.length * rh + 6, s, `the area model: ${big} times ${small}, broken apart by place`);
  return { model, say, grownups: "The area model (partial products): a rectangle split by place value, so 27 × 23 is four easy products, 20 × 20, 20 × 3, 7 × 20 and 7 × 3, added up. The standard algorithm does the same steps in columns." };
}

/* ---------- dividing (4.NBT.A.7) ---------- */
// Partial quotients: take away the biggest easy part, place by place. 936 ÷ 3: 900, 30 and 6.
function chunks(x, y) {
  const out = [];
  let rest = x;
  for (let p = 10 ** (String(x).length - 1); p >= 1; p /= 10) { const k = Math.floor(rest / (y * p)) * y * p; if (k) { out.push(k); rest -= k; } }
  return { out, rest };
}
function partialHint(f, worked) {
  let { out } = chunks(f.x, f.y);
  // One part only (200 ÷ 5 is 40 fives): split off one easy part first (50 ÷ 5 = 10), so the
  // parts never show the answer before answering.
  if (out.length === 1) { const easy = f.y * 10 ** (String(f.ans).length - 1); out = [f.x - easy, easy]; }
  const qs = out.map((k) => k / f.y);
  const W = 220, x0 = 30, y0 = 18, H = 40, widths = out.map((k) => Math.max(40, W * k / f.x)), sc = W / widths.reduce((a, b) => a + b, 0);
  let s = txt(x0 - 8, y0 + H / 2 + 5, f.y, 14, C.b, "end"), x = x0;
  out.forEach((k, i) => { const w = widths[i] * sc; s += `<rect x="${f1(x)}" y="${y0}" width="${f1(w)}" height="${H}" fill="${i % 2 ? C.b : C.a}" fill-opacity=".25" stroke="${C.ink}" stroke-width="2"/>` + txt(x + w / 2, y0 + H / 2 + 5, k, 13) + txt(x + w / 2, y0 - 5, qs[i], 12, C.a); x += w; });
  const say = `Break ${f.x} into parts: ${out.join(" + ")}. ${out.map((k, i) => `${k} ÷ ${f.y} = ${qs[i]}`).join(", ")}. ${qs.join(" + ")} = ${worked ? f.ans : "?"}`;
  return { model: svg(x0 + W + 8, y0 + H + 6, s, `${f.x} split into parts, each divided by ${f.y}`), say,
    grownups: "Partial quotients: kids split the number into parts they can divide easily (936 = 900 + 30 + 6), divide each, and add the answers. On the area model, it's the missing side of a rectangle." };
}
// Remainders: equal groups, as many as fit, and what's left. Small numbers as dots in rows of the
// divisor, some rows ringed and counted; bigger ones by partial quotients. Never the quotient or
// the remainder before answering.
function remHint(f, worked) {
  const why = "Remainders: sharing into equal groups, as many as fit; what can't make another whole group is left over, the remainder (29 ÷ 4 is 7 groups of 4, and 1 left). It's always less than the number in a group.";
  if (Math.ceil(f.x / f.y) <= 10) {
    // Each group a line of f.y dots, ringed: columns side by side when there are many groups, rows
    // when there are few, so the drawing stays wide and short.
    const n = Math.ceil(f.x / f.y), across = n >= f.y, ringed = worked ? f.quo : Math.floor(f.quo / 2), gap = 14, rh = 11;
    const at = (g, i) => (across ? [10 + g * gap, 8 + i * rh] : [10 + i * gap, 8 + g * rh]);
    const w = across ? n * gap + 6 : f.y * gap + 22, h = across ? f.y * rh + 20 : n * rh + 6, k = Math.min(1, 120 / h);
    let s = "";
    for (let i = 0; i < f.x; i++) {
      const g = Math.floor(i / f.y), left = g >= f.quo, [x, y] = at(g, i % f.y);
      s += `<circle cx="${x}" cy="${y}" r="4.5" fill="${left && worked ? C.b : C.a}" opacity="${worked || g < ringed ? 1 : 0.45}"/>`;
    }
    for (let g = 0; g < ringed; g++) {
      const [x, y] = at(g, 0);
      s += across ? `<rect x="${x - 7}" y="2" width="14" height="${f.y * rh + 1}" rx="7" fill="none" stroke="${C.line}" stroke-width="1.5"/>` + txt(x, f.y * rh + 16, g + 1, 10, C.a)
        : `<rect x="3" y="${y - 6}" width="${f.y * gap + 1}" height="12" rx="6" fill="none" stroke="${C.line}" stroke-width="1.5"/>` + txt(f.y * gap + 14, y + 4, g + 1, 10, C.a);
    }
    const body = `<g transform="scale(${f1(k)})">${s}</g>`;
    return { model: svg(f1(w * k), f1(h * k), body, `${f.x} dots in groups of ${f.y}`),
      say: worked ? `${f.quo} groups of ${f.y} is ${f.quo * f.y}. ${f.x} − ${f.quo * f.y} = ${f.rem} left: ${f.quo} R ${f.rem}.` : `Ring groups of ${f.y}. How many groups? How many left over?`, grownups: why };
  }
  const { out, rest } = chunks(f.x, f.y), qs = out.map((k) => k / f.y), first = out.length > 1 ? out.slice(0, out.length - 1) : [], done = first.reduce((a, b) => a + b, 0);
  let s = "", y = 16;
  first.forEach((k, i) => { s += txt(8, y, `${f.y} × ${qs[i]} = ${k}`, 13, C.a, "start"); y += 18; });
  s += txt(8, y, worked ? `${f.y} × ${qs[qs.length - 1]} = ${out[out.length - 1]}, ${rest} left` : `${f.x - done} left: how many ${f.y}s?`, 13, C.b, "start");
  return { model: svg(220, y + 8, s, `partial quotients for ${f.x} divided by ${f.y}`),
    say: worked ? `${qs.join(" + ")} = ${f.quo} groups of ${f.y}, and ${rest} left: ${f.quo} R ${f.rem}.` : first.length ? `Take away groups of ${f.y}: ${first.map((k, i) => `${f.y} × ${qs[i]} = ${k}`).join(", ")}. ${f.x} − ${done} = ${f.x - done}. How many more ${f.y}s, and what's left?` : `Take away groups of ${f.y} from ${f.x}. How many groups, and what's left?`, grownups: why };
}

/* ---------- adding and subtracting to a million: the standard algorithm ---------- */
// Column by column from the ones, in place-value words, regrouping as it goes. Before answering the
// first two columns and then "?"; worked, every column.
const NAMES = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"];
const one = (n) => n.replace(/s$/, "").replace(/ thousand$/, " thousand");
function algorithmHint(f, worked) {
  const sub = f.op === "-", a = sub ? f.x : Math.max(f.x, f.y), b = sub ? f.y : Math.min(f.x, f.y), n = String(Math.max(a, f.ans)).length;
  const A = String(a).padStart(n, "0").split("").map(Number).reverse(), B = String(b).padStart(n, "0").split("").map(Number).reverse();
  const steps = [], marks = [];
  let carry = 0;
  const top = A.slice();
  for (let i = 0; i < n; i++) {
    const nm = NAMES[i] || "";
    if (!sub) {
      const t = A[i] + B[i] + carry, parts = [A[i], B[i]].concat(carry ? [carry] : []).filter(Boolean);
      const sum = parts.length > 1 ? `${parts.join(" + ")} = ${t}` : String(t);
      steps.push(t >= 10 ? `${cap(nm)}: ${sum}. Write ${t % 10}, regroup 1 ${one(NAMES[i + 1] || "")}.` : `${cap(nm)}: ${sum}.`);
      marks.push(carry); carry = t >= 10 ? 1 : 0;
    } else {
      if (top[i] < B[i]) {
        let j = i + 1;
        while (top[j] === 0) j++;
        top[j]--; for (let k = j - 1; k > i; k--) top[k] = 9;
        steps.push(`${cap(nm)}: ${top[i]} is less than ${B[i]}, so regroup: ${top[i] + 10} − ${B[i]} = ${top[i] + 10 - B[i]}.`);
        top[i] += 10;
      } else steps.push(`${cap(nm)}: ${top[i]} − ${B[i]} = ${top[i] - B[i]}.`);
    }
    if (i + 1 >= String(a).length && !carry && (sub || i + 1 >= String(b).length)) break;
  }
  const shown = worked ? steps : steps.slice(0, 2);
  // The drawing: the two numbers in columns, the place names over them, and the answer row filled
  // only as far as the steps shown.
  const cw = 22, w = n * cw + 40, x = (i) => w - 14 - i * cw;
  let s = "";
  for (let i = 0; i < n; i++) {
    s += txt(x(i), 12, ["1", "10", "100", "1k", "10k", "100k"][i] || "", 8, C.muted);
    if (i < String(a).length) s += txt(x(i), 32, A[i], 17);
    if (i < String(b).length) s += txt(x(i), 52, B[i], 17);
    if (!sub && marks[i]) s += txt(x(i), 20, "1", 10, C.b);
    if (worked || i < 2) s += txt(x(i), 80, String(f.ans).split("").reverse()[i] ?? "", 17, C.a);
    else if (i < String(f.ans).length) s += txt(x(i), 80, "?", 15, C.b);
  }
  s += txt(12, 52, sub ? "−" : "+", 17) + `<line x1="8" y1="60" x2="${w - 4}" y2="60" stroke="${C.ink}" stroke-width="2"/>`;
  return { model: svg(w, 88, s, `${a} ${sub ? "minus" : "plus"} ${b}, in columns`),
    say: `${shown.join(" ")} ${worked ? "" : "Keep going! "}${f.x} ${sub ? "−" : "+"} ${f.y} = ${worked ? f.ans : "?"}`.replace(/\s+/g, " "),
    grownups: "The standard algorithm (4th grade): add or subtract place by place from the ones. Ten in a place regroups to one of the next place; not enough in a place regroups one from the next place into ten. The words are the place values, not \"carry\" and \"borrow\"." };
}
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/* ---------- comparing to a million ---------- */
function bigCompareHint(f, worked) {
  const a = String(f.l), b = String(f.r), n = Math.max(a.length, b.length), A = a.padStart(n, " "), B = b.padStart(n, " ");
  const at = [...A].findIndex((c, i) => c !== B[i]), names = NAMES.slice(0, n).reverse(), cw = 34;
  let s = "";
  names.forEach((nm, i) => {
    const x = 8 + i * cw, on = i === at;
    s += txt(x + cw / 2 - 2, 11, nm.replace("hundred thousands", "100,000s").replace("ten thousands", "10,000s").replace("thousands", "1000s").replace("hundreds", "100s"), 8, C.muted);
    if (on) s += `<rect x="${x}" y="15" width="${cw - 4}" height="56" rx="7" fill="none" stroke="${C.b}" stroke-width="3"/>`;
    [[A[i], 36], [B[i], 64]].forEach(([d, y], k) => { const bigger = worked && on && Number(d) > Number((k ? A : B)[i]); s += txt(x + cw / 2 - 2, y, d.trim(), 18, bigger ? C.a : C.ink); });
  });
  const first = at < 0 ? "Every place is the same." : at === 0 && a.length !== b.length ? "One number has more digits." : `Start at the biggest place. The first one that's different: ${A[at].trim() || 0} and ${B[at].trim() || 0} ${names[at]}.`;
  return { model: svg(n * cw + 12, 76, s, `${f.l} and ${f.r} in a place-value chart`), say: `${first} ${worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r}`,
    grownups: "Comparing big numbers: line them up by place. The one with more digits is bigger; otherwise look at the biggest place first, then the next, until one is different." };
}

/* ---------- fractions ---------- */
// Fraction bars of the same whole, each in parts, some shaded.
function bars(rows, W = 200) {
  const X0 = 50;
  let s = "";
  rows.forEach(([label, d, shaded, color, wholes = 1], j) => {
    const y = 4 + j * 32, ww = W / Math.max(1, wholes);
    s += txt(X0 - 8, y + 18, label, 13, color, "end");
    for (let w = 0; w < wholes; w++) for (let i = 0; i < d; i++) { const k = w * d + i; s += `<rect x="${f1(X0 + w * ww + i * ww / d)}" y="${y}" width="${f1(ww / d)}" height="24" fill="${k < shaded ? color : "none"}" stroke="${C.ink}" stroke-width="${d > 12 ? 0.8 : 1.8}"/>`; }
    // Each whole outlined, so 2 1/8 reads as two wholes and a piece.
    if (wholes > 1) for (let w = 0; w < wholes; w++) s += `<rect x="${f1(X0 + w * ww + 1.5)}" y="${y - 1}" width="${f1(ww - 3)}" height="26" rx="2" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  });
  return { s, w: X0 + W + 6, h: rows.length * 32 + 4 };
}
// Equivalent fractions: multiply (or divide) the top and the bottom by the same number.
function equivHint(f, worked) {
  const up = f.d > f.b, k = up ? f.d / f.b : f.b / f.d, end = worked ? f.ans : "?";
  // When that number is the answer too (1/2 = 6/12), it's a □ until answered.
  const n = k === f.ans && !worked ? "□" : k, sign = up ? "×" : "÷";
  const say = `${f.b} ${sign} ${n} = ${f.d}, so the top ${sign} ${n} too: ${f.a} ${sign} ${n} = ${end}`;
  const B = bars([[`${f.a}/${f.b}`, f.b, f.a, C.a], [`${worked ? f.ans : "□"}/${f.d}`, f.d, worked ? f.ans : 0, C.b]]);
  return { model: svg(B.w, B.h, B.s, `fraction bars: ${f.a}/${f.b} and ${f.d} parts`), say,
    grownups: "Equivalent fractions: multiplying the top and the bottom by the same number cuts every piece into that many smaller ones, so it's the same amount: 3/4 = 6/8. Dividing both (8/12 = 2/3) puts pieces back together." };
}
// Comparing with unlike denominators: make the bottoms the same, or compare to 1/2.
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function fracCompare4Hint(f, worked) {
  const [ln, ld] = f.l.split("/").map(Number), [rn, rd] = f.r.split("/").map(Number), D = ld * rd / gcd(ld, rd);
  const half = (ln * 2 - ld) * (rn * 2 - rd) < 0 && ld !== rd && ![ln * D / ld, rn * D / rd].some((n) => n > 24);
  let say;
  if ((ld === 2 && ln === 1) || (rd === 2 && rn === 1) || (half && D > 12)) say = `Compare to 1/2: half of ${ld} is ${ld / 2}, half of ${rd} is ${rd / 2}.`;
  else say = `Make the bottoms the same: ${f.l} = ${ln * D / ld}/${D}, ${f.r} = ${rn * D / rd}/${D}.`;
  const B = bars([[f.l, ld, ln, C.a], [f.r, rd, rn, C.b]]);
  let s = B.s;
  if (worked) { const i = f.sym === "<" ? 1 : 0; s += `<rect x="46" y="${i * 32}" width="208" height="32" rx="6" fill="none" stroke="${C.a}" stroke-width="3"/>`; }
  return { model: svg(B.w, B.h, s, `fraction bars: ${f.l} and ${f.r}`), say: `${say} ${worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r}`,
    grownups: "Comparing fractions with different bottoms: make them the same (2/3 = 8/12 and 3/4 = 9/12, so 3/4 is more), or compare each to a benchmark like 1/2 (5/8 is more than half, 3/8 less)." };
}
// Adding and subtracting, unit fractions, a fraction times a whole, and tenths with hundredths.
function fracOpHint(f, worked) {
  const end = worked ? f.ans : "?", why = "Adding and subtracting fractions with the same bottom: the pieces are the same size, so add or take away the tops; the bottom (the size of the pieces) stays. Mixed numbers: the wholes, then the pieces. 4th grade doesn't simplify (5 3/3 is fine).";
  if (f.kind === "times") {
    const B = bars(Array.from({ length: Math.min(f.k, 3) }, (_, i) => [`${f.n}/${f.d}`, f.d, f.n, i % 2 ? C.b : C.a]));
    return { model: svg(B.w, B.h + (f.k > 3 ? 16 : 0), B.s + (f.k > 3 ? txt(150, B.h + 12, `… ${f.k} of them`, 12, C.muted) : ""), `${f.k} groups of ${f.n}/${f.d}`),
      say: `${f.k} × ${f.n}/${f.d} is ${Array(f.k).fill(f.n + "/" + f.d).join(" + ")}. The tops: ${f.k} × ${f.n} = ${end}`,
      grownups: "A fraction times a whole number: 3 × 2/5 is three groups of 2/5, so 2/5 + 2/5 + 2/5, which is 6 fifths. Multiply the top; the size of the pieces stays." };
  }
  if (f.kind === "tenths") {
    const B = bars([[`${f.a}/10`, 10, f.a, C.a], [`${f.a * 10}/100`, 10, f.a, C.a]]);
    return { model: svg(B.w, B.h, B.s, "tenths as hundredths"), say: `1 tenth is 10 hundredths: ${f.a}/10 = ${f.a * 10}/100. ${f.a * 10} + ${f.b} = ${end}`,
      grownups: "Tenths and hundredths: to add 3/10 and 4/100, make the tenths hundredths first (3/10 = 30/100), then add the tops: 34/100." };
  }
  if (f.kind === "split") {
    const B = bars([[`${f.n}/${f.d}`, f.d, f.n, C.a], [`${f.a}/${f.d} + ${f.b}/${f.d}`, f.d, f.a + f.b, C.b]]);
    return { model: svg(B.w, B.h, B.s, `${f.n}/${f.d} as parts`), say: `Build it from pieces: ${f.n} − ${f.a} − ${f.b} = ${end}`, grownups: "Building fractions from unit fractions: 5/8 is five 1/8 pieces, so it can be split up any way the tops add to 5: 1/8 + 2/8 + 2/8." };
  }
  if (!f.slots) {
    const sub = f.kind === "sub", B = bars(sub ? [[`${f.l.n}/${f.d}`, f.d, f.l.n, C.a]] : [[`${f.l.n}/${f.d}`, f.d, f.l.n, C.a], [`${f.r.n}/${f.d}`, f.d, f.r.n, C.b]]);
    return { model: svg(B.w, B.h, B.s, "fraction bars"), say: `Same size pieces: ${sub ? "take away" : "add"} the tops. ${f.l.n} ${sub ? "−" : "+"} ${f.r.n} = ${end}`, grownups: why };
  }
  const sub = f.kind === "msub", B = bars([[`${f.l.w} ${f.l.n}/${f.d}`, f.d, f.l.w * f.d + f.l.n, C.a, f.l.w + 1], [`${f.r.w ? f.r.w + " " : ""}${f.r.n}/${f.d}`, f.d, f.r.w * f.d + f.r.n, C.b, f.l.w + 1]], 220);
  return { model: svg(B.w, B.h, B.s, "wholes and fraction bars"),
    say: worked ? `The wholes: ${f.r.w ? `${f.l.w} ${sub ? "−" : "+"} ${f.r.w} = ${f.whole}` : f.whole}. The pieces: ${f.l.n} ${sub ? "−" : "+"} ${f.r.n} = ${f.num}. ${f.whole} and ${f.num}/${f.d}.` : `${sub ? "Take away" : "Add"} the wholes, then the pieces. How many wholes? How many ${f.d}ths?`.replace(/(\d)ths/, (m, d) => ({ 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 8: "eighths" }[d] || m)),
    grownups: why };
}
// Decimals: tenths and hundredths in a place-value chart, and on a hundred grid.
function grid(cells, x0, color) {
  let s = "";
  for (let i = 0; i < 100; i++) { const c = Math.floor(i / 10), r = i % 10; s += `<rect x="${x0 + c * 6}" y="${4 + r * 6}" width="6" height="6" fill="${i < cells ? color : "none"}" stroke="${C.line}" stroke-width=".6"/>`; }
  return s + `<rect x="${x0}" y="4" width="60" height="60" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
}
function decHint(f, worked) {
  const [, frac] = f.dec.split("."), t = Number(frac[0]), h = frac[1] != null ? Number(frac[1]) : null, end = worked ? f.ans : "?";
  const say = f.d === 10 ? `The first place after the point is tenths. Tenths = ${end}` : h == null ? `${f.dec} is ${t} tenths, and 1 tenth is 10 hundredths. ${t} × 10 = ${end}` : t ? `${f.dec} is ${t} tenths and ${h} hundredths. ${t * 10} + ${h} = ${end}` : `${f.dec} has no tenths, just hundredths. Hundredths = ${end}`;
  const s = grid(worked ? Math.round(Number(f.dec) * 100) : t * 10, 8, C.a) + txt(120, 26, f.dec, 18, C.a) + txt(120, 50, worked ? `${f.ans}/${f.d}` : `□/${f.d}`, 16, C.b);
  return { model: svg(160, 68, s, `${f.dec} on a hundred grid`), say,
    grownups: "Decimals: the first place after the point is tenths, the next hundredths. On a hundred grid a tenth is a column of ten squares, so 0.47 is 4 columns and 7 squares: 47 hundredths." };
}
function decCompareHint(f, worked) {
  const a = Math.round(Number(f.l) * 100), b = Math.round(Number(f.r) * 100);
  let s = grid(a, 8, C.a) + grid(b, 96, C.b) + txt(38, 76, f.l, 12, C.a) + txt(126, 76, f.r, 12, C.b);
  if (worked) s += compareRing(f.sym === "<" ? 92 : 4);
  const hund = (t) => (t.split(".")[1].length === 1 ? `${t} is ${t}0` : null);
  const same = [hund(f.l), hund(f.r)].filter(Boolean).join(", ");
  return { model: svg(164, 82, s, `${f.l} and ${f.r} on hundred grids`), say: `${same ? "Write them as hundredths: " + same + ". " : ""}Which grid shades more? ${worked ? f.l + " " + f.sym + " " + f.r : f.l + " ? " + f.r}`,
    grownups: "Comparing decimals: line up the points and compare tenths, then hundredths. 0.5 is 0.50, fifty hundredths, more than 0.45. A longer decimal isn't bigger." };
}
const compareRing = (x) => `<rect x="${x}" y="0" width="68" height="68" rx="6" fill="none" stroke="${C.a}" stroke-width="3"/>`;

/* ---------- algebraic thinking ---------- */
function exprHint(f, worked) {
  const end = worked ? f.ans : "?";
  if (f.kind === "n") {
    const inv = { "+": ["−", f.b - f.a], "-": ["+", f.b + f.a], "÷": ["×", f.b * f.a], "×": ["÷", f.b / f.a] }[f.vop];
    const say = f.vop === "×" ? `n is how many ${f.a}s make ${f.b}. ${f.b} ÷ ${f.a} = ${end}` : `Undo it: ${f.b} ${inv[0]} ${f.a} = ${end}`;
    return { model: svg(200, 40, txt(100, 26, f.eq.replace("n", "□"), 18, C.a), "the equation with n as a box"), say,
      grownups: "A letter for a number: n − 15 = 27 asks what number, take away 15, is 27. Kids undo it with the opposite operation (27 + 15) and check by putting the answer back in." };
  }
  // The first step underlined: its width estimated from the characters (Bungee-free bold text,
  // about 9.5 units a character at 17).
  const firstText = `${f.a} ${f.o1} ${f.b}`, cw = 9.5, x0 = 100 - (f.q.length * cw) / 2, uw = firstText.length * cw;
  const s = txt(x0, 22, f.q, 17, C.a, "start") + `<path d="M${f1(x0)} 30 h${f1(uw)}" stroke="${C.b}" stroke-width="3"/>` + txt(x0 + uw / 2, 48, "first", 12, C.b);
  return { model: svg(200, 56, s, "two steps, the first underlined"), say: `First ${f.a} ${f.o1} ${f.b} = ${f.first}. Then ${f.first} ${f.o2 === "-" ? "−" : f.o2} ${f.c} = ${end}`,
    grownups: "Multi-step problems: do one step at a time, the multiplying or dividing first, and write each step down." };
}
function factorHint(f, worked) {
  const W = 150, H = 44, x0 = 28, y0 = 20;
  const s = `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="2" fill="${C.a}" fill-opacity=".3" stroke="${C.a}" stroke-width="2.5"/>` + txt(x0 - 12, y0 + H / 2 + 5, f.a) + txt(x0 + W / 2, y0 - 6, worked ? f.ans : "?", 14, C.b) + txt(x0 + W / 2, y0 + H / 2 + 6, f.n, 17);
  return { model: svg(x0 + W + 8, y0 + H + 6, s, `${f.a} by what makes ${f.n}`), say: `How many ${f.a}s make ${f.n}? ${f.n} ÷ ${f.a} = ${worked ? f.ans : "?"}`,
    grownups: "Factor pairs: two numbers that multiply to make it. Kids find the other factor by dividing, or with a rectangle of that area and one side known." };
}

/* ---------- measurement and area ---------- */
function unitHint(f, worked) {
  const U = UNITS[f.pair], rows = Math.min(4, f.n + 1), show = worked ? rows : Math.max(1, Math.min(rows - 1, f.n - 1));
  let s = txt(40, 14, U[5], 12, C.a) + txt(110, 14, U[6], 12, C.b) + `<line x1="6" y1="20" x2="150" y2="20" stroke="${C.line}" stroke-width="1.5"/><line x1="76" y1="4" x2="76" y2="${24 + rows * 16}" stroke="${C.line}" stroke-width="1.5"/>`;
  const list = [1, 2, 3].filter((k) => k < f.n).slice(0, rows - 1).concat([f.n]);
  list.forEach((k, i) => { const y = 36 + i * 16; s += txt(40, y, k, 13) + txt(110, y, k === f.n ? (worked ? f.ans : "?") : i < show ? k * U[0] : "", 13, k === f.n ? C.b : C.ink); });
  return { model: svg(156, 30 + list.length * 16, s, `a table: ${U[5]} and ${U[6]}`), say: `1 ${U[5]} = ${U[0]} ${U[6]}. ${f.n} × ${U[0]} = ${worked ? f.ans : "?"}`.replace("1 $ =", "$1 is").replace(/ ¢/g, "¢"),
    grownups: "Converting units: a bigger unit is several smaller ones (1 ft = 12 in), so kids make a table, 1 ft is 12 in, 2 ft 24 in, 3 ft 36 in, and see it's multiplying by 12." };
}
function rect4Hint(f, worked) {
  const end = worked ? f.ans : "?", model = fitted(rectSvg(f, { worked }), 100, "a rectangle");
  if (f.kind === "s") return { model, say: `Area = length × width. ${f.h} × □ = ${f.area}. ${f.area} ÷ ${f.h} = ${end}`, grownups: "A missing side from the area: area = length × width, so the other side is the area divided by the side you know." };
  if (f.kind === "q") return { model, say: `Take away the two sides you know: ${f.per} − ${2 * f.h} = ${f.per - 2 * f.h}. ${f.per - 2 * f.h} ÷ 2 = ${end}`, grownups: "A missing side from the perimeter: take away the two sides you know, and the other two are equal, so halve what's left." };
  if (f.kind === "a") return { model, say: `Area = length × width: ${f.w} × ${f.h} = ${end}`, grownups: "The area formula: A = l × w, the rows and columns of squares, without drawing them." };
  return { model, say: `Perimeter = length + width + length + width: ${f.w} + ${f.h} + ${f.w} + ${f.h} = ${end}`, grownups: "The perimeter formula: all four sides, P = l + w + l + w, or 2 × l + 2 × w." };
}


/* ---------- prime or composite (4.RA.B) ----------
   Factor pairs as rectangles of the same area: n squares as 1 row of n, and every other way to make
   equal rows. Before answering, only the 1 × n rectangle, and the question whether another can be
   made (never "prime" or "composite"); worked, every rectangle, and which it is. */
function primeHint(f, worked) {
  const pairs = factorPairs(f.n), shown = worked ? pairs : pairs.slice(0, 1), k = 170 / f.n;
  let s = "", y = 4;
  for (const [a, b] of shown) {
    const w = Math.max(4, b * k), h = Math.max(5, a * k);
    s += `<rect x="6" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${C.a}" fill-opacity=".3" stroke="${C.a}" stroke-width="2"/>`;
    s += txt(w + 14, y + h / 2 + 5, `${a} × ${b}`, 12, C.ink, "start");
    y += h + 8;
  }
  if (!worked) { s += `<rect x="6" y="${f1(y)}" width="40" height="18" fill="none" stroke="${C.b}" stroke-width="2" stroke-dasharray="4 3"/>` + txt(26, y + 14, "?", 13, C.b); y += 26; }
  const ds = [2, 3, 5, 7].filter((d) => d < f.n), smalls = ds.length > 1 ? ds.slice(0, -1).join(", ") + " or " + ds[ds.length - 1] : ds.join("");
  const say = worked
    ? (f.sym === "P" ? `${f.n} is only 1 × ${f.n}: one rectangle. ${f.n} is prime.` : `${f.n} is ${pairs.slice(1).map(([a, b]) => `${a} × ${b}`).join(", ")} too: more than one rectangle. ${f.n} is composite.`)
    : `1 × ${f.n} makes one rectangle. Can ${smalls || "another number"} make equal rows too?`;
  return { model: svg(250, Math.max(y, 30), s, `factor pairs of ${f.n} as rectangles`), say,
    grownups: "Prime or composite: a prime number has exactly two factors, 1 and itself, so its squares make only one rectangle (1 row). A composite number has more factor pairs, so it makes more than one rectangle. 1 is neither." };
}

/* ---------- money with a decimal point (4.GM.C.7) ----------
   Count on, as with the Mines' dollars: from the first amount, the dollars, then the cents (hops on
   an open line). Making change counts up from the price to the next dollar, then to what was paid.
   Before answering the last stop is "?"; worked, every stop. */
const M = (c) => moneyText4(c);
const C$ = (c) => (c >= 100 ? M(c) : c + "¢");
function moneyHint(f, worked) {
  const why = "Money with a decimal point: dollars before the point, cents after it, and 100 cents make a dollar. Kids count on from the biggest amount, the dollars first, then the cents; for change they count up from the price to the next dollar, then to what was paid.";
  if (f.kind === "cents") {
    const d = Math.floor(f.a / 100), k = f.a % 100;
    return { model: svg(200, 40, txt(100, 26, `${M(f.a)} = ${worked ? f.ans : "□"}¢`, 18, C.a), "dollars as cents"),
      say: `$1 is 100¢, so $${d} is ${d * 100}¢. ${d * 100} + ${k} = ${worked ? f.ans : "?"}`, grownups: why };
  }
  let stops, labels;
  if (f.kind === "change" && f.a % 100 === 0) {
    const next = Math.ceil(f.b / 100) * 100;
    stops = [f.b, next, f.a].filter((v, i, a) => i === 0 || v !== a[i - 1]);
    labels = stops.slice(1).map((v, i) => "+" + C$(v - stops[i]));
  } else if (f.kind === "change") {
    const mid = f.a - Math.floor(f.b / 100) * 100;
    stops = [f.a, mid, f.ans]; labels = ["−" + C$(Math.floor(f.b / 100) * 100), "−" + C$(f.b % 100)];
  } else {
    const mid = f.a + Math.floor(f.b / 100) * 100;
    stops = [f.a, mid, f.ans]; labels = ["+" + C$(Math.floor(f.b / 100) * 100), "+" + C$(f.b % 100)];
  }
  const n = stops.length, W = 230, x = (i) => 20 + i * (W - 40) / (n - 1);
  let s = `<line x1="10" y1="40" x2="${W - 10}" y2="40" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`;
  stops.forEach((v, i) => {
    const last = i === n - 1, t = last && !worked ? "?" : M(v);
    s += `<circle cx="${f1(x(i))}" cy="40" r="4.5" fill="${last ? C.b : C.a}"/>` + txt(x(i), 62, t, 12, last ? C.b : C.ink);
    if (i) s += `<path d="M${f1(x(i - 1) + 6)} 34 Q${f1((x(i - 1) + x(i)) / 2)} 6 ${f1(x(i) - 6)} 34" fill="none" stroke="${C.a}" stroke-width="2"/>` + txt((x(i - 1) + x(i)) / 2, 14, labels[i - 1], 11, C.a);
  });
  let say;
  if (f.kind === "change" && f.a % 100 === 0) {
    const parts = labels.map((l) => l.slice(1));
    say = `Count up from ${M(f.b)}: ${stops.slice(1).map((v, i) => `${labels[i]} is ${M(v)}`).join(", ")}. ${parts.join(" and ")} is ${worked ? M(f.ans) : "?"}`;
  } else {
    say = `Start at ${M(f.a)}. ${labels[0]} is ${M(stops[1])}. ${labels[1]} is ${worked ? M(f.ans) : "?"}`;
  }
  return { model: svg(W, 70, s, "counting on with money"), say, grownups: why };
}

/* ---------- which of 4th grade's facts this module hints ---------- */
export function isFourthHint(f) {
  if ("REFƒdu∠PD".includes(f.op)) return true;
  if (f.op === "○") return !!(f.big || f.dec || (f.frac && f.frac === "eq" && f.sym !== "=" && !(f.l === "2/4" || f.r === "2/4")) || (f.frac && /\/(5|9|10|12)\b/.test(f.l + "," + f.r)));
  if (f.op === "/") return [5, 9, 10, 12, 100].includes(f.d) || [5, 9, 10, 12, 100].includes(f.b);
  if (f.op === "▭") return f.kind === "s" || f.kind === "q" || Math.max(f.w, f.h) > 9;
  if (f.blank) return false;
  if (f.op === "+" || f.op === "-") return Math.max(f.x, f.y) >= 1000;
  if (f.op === "×") { const a = Math.min(f.x, f.y), b = Math.max(f.x, f.y); if (b <= 12) return false; return !(a < 10 && b < 100 && b % 10 === 0); }
  if (f.op === "÷") return f.x > 144 || (f.ans > 12 && f.y <= 9);
  return false;
}
export function fourthHint(f, worked) {
  if (f.op === "∠") { const h = angleHint(f, worked); return { model: fitted(angleSvg(f, { hint: true, worked }), 120, "the hint, drawn on the picture"), say: h.say, grownups: h.grownups }; }
  if (f.op === "R") return remHint(f, worked);
  if (f.op === "P") return primeHint(f, worked);
  if (f.op === "D") return moneyHint(f, worked);
  if (f.op === "E") return exprHint(f, worked);
  if (f.op === "F") return factorHint(f, worked);
  if (f.op === "ƒ") return fracOpHint(f, worked);
  if (f.op === "d") return decHint(f, worked);
  if (f.op === "u") return unitHint(f, worked);
  if (f.op === "▭") return rect4Hint(f, worked);
  if (f.op === "○") return f.big ? bigCompareHint(f, worked) : f.dec ? decCompareHint(f, worked) : fracCompare4Hint(f, worked);
  if (f.op === "/") return equivHint(f, worked);
  if (f.op === "+" || f.op === "-") return algorithmHint(f, worked);
  if (f.op === "÷") return partialHint(f, worked);
  const a = Math.min(f.x, f.y), b = Math.max(f.x, f.y), nz = (n) => String(n).replace(/0+$/, "").length;
  if (nz(a) === 1 && nz(b) === 1) return timesPlaceHint(f, worked);
  return areaModelHint(f, worked);
}

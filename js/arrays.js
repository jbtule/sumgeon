// Arrays (2nd grade, 2.OA.C.4; Squaresquatch in the Crystal Mines): dots in rows and columns,
// up to 5 by 5, added as equal rows (3 rows of 5 is 5 + 5 + 5). It leads into multiplication and
// area in the Tower, but here it's adding, so it has keys of its own ("▦3,5": 3 rows of 5) and
// never touches the times tables' records. A strand: Squaresquatch asks it one floor a run.
// No DOM: runs in Node for the tests.

export function arrayFact(r, c) {
  return { op: "▦", r, c, ans: r * c, q: Array(r).fill(c).join(" + ") + " = □", key: "▦" + r + "," + c };
}
export function arrayFactOf(key) {
  const [r, c] = key.slice(1).split(",").map(Number);
  return arrayFact(r, c);
}
// 2 to 5 rows of 2 to 5: 16 facts.
export function arrayFacts() {
  const out = [];
  for (let r = 2; r <= 5; r++) for (let c = 2; c <= 5; c++) out.push(arrayFact(r, c));
  return out;
}
// The strand's levels: up to 3 rows, then 4 and 5 rows.
export const ARRAY_LEVELS = [
  { name: "Arrays of 2 and 3 rows", has: (f) => f.op === "▦" && f.r <= 3 },
  { name: "Arrays of 4 and 5 rows", has: (f) => f.op === "▦" && f.r > 3 }
];
// The array as the problem shows it: gold dots in rows, a faint line under each row.
export function arraySvg(f) {
  const G = 26, x0 = 8, y0 = 8, W = f.c * G, H = f.r * G, ink = "var(--ink, #f3efe4)";
  let s = "";
  for (let i = 0; i < f.r; i++) {
    s += `<rect x="${x0 - 3}" y="${y0 + i * G + 1}" width="${W + 6}" height="${G - 2}" rx="${(G - 2) / 2}" fill="none" stroke="${ink}" stroke-opacity=".35" stroke-width="1.5"/>`;
    for (let j = 0; j < f.c; j++) s += `<circle cx="${x0 + j * G + G / 2}" cy="${y0 + i * G + G / 2}" r="${G * 0.32}" fill="#ffc93c" stroke="#0c171c" stroke-width="1.5"/>`;
  }
  const vw = W + 2 * x0, vh = H + 2 * y0;
  return `<svg class="rectfig arrayfig" viewBox="0 0 ${vw} ${vh}" width="${Math.round(vw * 1.2)}" height="${Math.round(vh * 1.2)}" role="img" aria-label="${f.r} rows of ${f.c}">${s}</svg>`;
}

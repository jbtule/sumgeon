// Traces a portrait engraving into a few flat tones for the prototype's dollar bills
// (js/dollars.js), the way the coin portraits were simplified: the light parts (face, hair,
// collar) and the dark parts (coat, deep shadows) as SVG paths in a 200 × 200 box over the
// engraving's oval. Averaging the engraving's hatching over small cells turns it into tones.
//
//   NODE_PATH=<playwright> node design/bills/trace.cjs <image> <crop x,y,w,h> [cells] [light] [dark] [blur passes] [smallest area] [dark starts at, of the height] > out.json
//
// The sources are the Bureau of Engraving and Printing's engraved portraits on Wikimedia Commons
// (public domain, US government works): "HAMILTON, Alexander-Treasury (BEP engraved portrait)
// (cropped).jpg" and "JACKSON, Andrew-President (BEP engraved portrait).jpg". The crops used are
// in design/bills/README.md.
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const [file, crop, cellsArg, lightArg, darkArg, blurArg, areaArg, topArg] = process.argv.slice(2);
  const [cx, cy, cw, ch] = crop.split(",").map(Number), cells = Number(cellsArg) || 90;
  const b = await chromium.launch();
  const p = await b.newPage();
  const data = "data:image/jpeg;base64," + fs.readFileSync(file).toString("base64");
  const out = await p.evaluate(async ([data, cx, cy, cw, ch, cells, LIGHT, DARK, BLUR, AREA, TOP]) => {
    const img = new Image(); img.src = data; await img.decode();
    const gw = cells, gh = Math.round(cells * ch / cw);
    const c = document.createElement("canvas"); c.width = gw; c.height = gh;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
    g.drawImage(img, cx, cy, cw, ch, 0, 0, gw, gh);
    const px = g.getImageData(0, 0, gw, gh).data, L = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) L[i] = (0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2]) / 255;
    // Blurred (BLUR passes), so the hatching evens out into tones.
    let B = L;
    for (let pass = 0; pass < BLUR; pass++) {
      const N = new Float32Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < gw && yy < gh) { s += B[yy * gw + xx] * (dx || dy ? 1 : 2); n += dx || dy ? 1 : 2; } }
        N[y * gw + x] = s / n;
      }
      B = N;
    }
    // Inside the oval only.
    const inside = (x, y) => ((x + 0.5 - gw / 2) / (gw / 2)) ** 2 + ((y + 0.5 - gh / 2) / (gh / 2)) ** 2 < 0.86;
    // Contours of a mask, by marching squares, joined into closed loops in a 200 box.
    function loops(mask) {
      const at = (x, y) => (x >= 0 && y >= 0 && x < gw && y < gh ? mask[y * gw + x] : 0);
      const segs = [];
      for (let y = -1; y < gh; y++) for (let x = -1; x < gw; x++) {
        const a = at(x, y), b2 = at(x + 1, y), c2 = at(x + 1, y + 1), d = at(x, y + 1);
        const T = [x + 0.5 + 0.5, y + 0.5], R = [x + 1 + 0.5, y + 0.5 + 0.5], Bm = [x + 0.5 + 0.5, y + 1 + 0.5], Lm = [x + 0.5, y + 0.5 + 0.5];
        const k = a * 8 + b2 * 4 + c2 * 2 + d;
        const add = (p1, p2) => segs.push([p1, p2]);
        switch (k) {
          case 1: add(Lm, Bm); break; case 2: add(Bm, R); break; case 3: add(Lm, R); break; case 4: add(R, T); break;
          case 5: add(Lm, T); add(R, Bm); break; case 6: add(Bm, T); break; case 7: add(Lm, T); break; case 8: add(T, Lm); break;
          case 9: add(T, Bm); break; case 10: add(T, R); add(Bm, Lm); break; case 11: add(T, R); break; case 12: add(R, Lm); break;
          case 13: add(R, Bm); break; case 14: add(Bm, Lm); break;
        }
      }
      // Join the segments into loops by their shared ends (either way round).
      const key = (q) => q[0] + "," + q[1], ends = new Map();
      segs.forEach((s, i) => { for (const q of s) { const k2 = key(q); if (!ends.has(k2)) ends.set(k2, []); ends.get(k2).push(i); } });
      const used = new Uint8Array(segs.length), out = [];
      for (let i = 0; i < segs.length; i++) {
        if (used[i]) continue;
        used[i] = 1;
        const loop = [segs[i][0], segs[i][1]];
        for (;;) {
          const tail = loop[loop.length - 1], j = (ends.get(key(tail)) || []).find((n) => !used[n]);
          if (j === undefined) break;
          used[j] = 1;
          const s = segs[j];
          loop.push(key(s[0]) === key(tail) ? s[1] : s[0]);
        }
        if (loop.length > 6) out.push(loop);
      }
      return out;
    }
    // Ramer–Douglas–Peucker, then the points scaled into the 200 box.
    function rdp(pts, eps) {
      if (pts.length < 3) return pts;
      const [a, b2] = [pts[0], pts[pts.length - 1]];
      let best = 0, idx = 0;
      for (let i = 1; i < pts.length - 1; i++) {
        const d = Math.abs((b2[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b2[1] - a[1])) / (Math.hypot(b2[0] - a[0], b2[1] - a[1]) || 1);
        if (d > best) { best = d; idx = i; }
      }
      return best > eps ? rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps)) : [a, b2];
    }
    const k = 200 / Math.max(gw, gh), ox = (200 - gw * k) / 2, oy = (200 - gh * k) / 2;
    // A closed loop is simplified as two halves (its ends meet, so as one it would collapse).
    // Then rounded off twice (Chaikin), so the edges read as drawn curves rather than cells.
    const chaikin = (l) => l.flatMap((q, i) => { const r = l[(i + 1) % l.length]; return [[0.75 * q[0] + 0.25 * r[0], 0.75 * q[1] + 0.25 * r[1]], [0.25 * q[0] + 0.75 * r[0], 0.25 * q[1] + 0.75 * r[1]]]; });
    const simplify = (l) => { const h = Math.floor(l.length / 2); return chaikin(chaikin(rdp(l.slice(0, h + 1), 0.55).slice(0, -1).concat(rdp(l.slice(h), 0.55)).slice(0, -1))); };
    const path = (mask, minArea) => loops(mask).map(simplify).filter((l) => {
      let a = 0; l.forEach((q, i) => { const r = l[(i + 1) % l.length]; a += q[0] * r[1] - r[0] * q[1]; }); return Math.abs(a / 2) >= minArea;
    }).map((l) => "M" + l.map(([x, y]) => `${Math.round((ox + x * k) * 10) / 10} ${Math.round((oy + y * k) * 10) / 10}`).join("L") + "Z").join("");
    const tone = (lo, hi) => { const m = new Uint8Array(gw * gh); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { const v = B[y * gw + x]; m[y * gw + x] = inside(x, y) && v >= lo && v < hi && (lo >= 0 || y > gh * TOP) ? 1 : 0; } return m; };
    const hist = Array.from({ length: 10 }, () => 0); B.forEach((v) => hist[Math.min(9, Math.floor(v * 10))]++);
    return { gw, gh, hist, light: path(tone(LIGHT, 2), AREA), dark: path(tone(-1, DARK), AREA) };
  }, [data, cx, cy, cw, ch, cells, Number(lightArg) || 0.62, Number(darkArg) || 0.25, Number(blurArg) || 1, Number(areaArg) || 2, Number(topArg) || 0.33]);
  process.stdout.write(JSON.stringify(out));
  await b.close();
})();

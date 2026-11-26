// Cache busting, shared by the deploy (scripts/stamp.mjs) and the local dev server
// (scripts/dev-server.mjs): every local file a page loads gets ?v=<version>, the attributes in
// STAMPED and every js/*.js module through the page's import map (modules import each other by
// plain relative paths, and the map points each one at its stamped address).
import { readdirSync } from "node:fs";
import { join } from "node:path";

// Attributes in index.html that load a local file, e.g. 'src="js/app.js"'. The icons too:
// browsers, Safari most of all, keep an icon long after it changes, but fetch a new address.
export const STAMPED = ['href="styles.css"', 'src="js/app.js"', 'href="manifest.webmanifest"', 'href="favicon.svg"', 'href="apple-touch-icon.png"'];
// The grown-up pages: [folder, script]. Each loads the game's modules through its own import map.
export const PAGES = [["review/listen", "listen.js"], ["review/spell", "spell.js"], ["review/moments", "moments.js"], ["review/gallery", "gallery.js"], ["review/proto", "proto.js"]];
// Other local files a grown-up page loads (the moments page, the gallery and the prototype use
// the game's stylesheet).
const PAGE_EXTRA = { "review/moments": ['href="../../styles.css"'], "review/gallery": ['href="../../styles.css"'], "review/proto": ['href="../../styles.css"'] };

const modules = (root) => readdirSync(join(root, "js")).filter((f) => f.endsWith(".js"));

// Replaces from with to exactly once, so a markup change can't silently skip one.
function swapOnce(text, from, to, where) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`stamp: expected 1 match for ${JSON.stringify(from)} in ${where}, found ${n}`);
  return text.replace(from, to);
}
function withMap(text, map, where) {
  const m = text.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`stamp: no import map in ${where}`);
  return text.replace(m[1], "\n" + JSON.stringify(map, null, 2) + "\n");
}

// The game's index.html, stamped with version v (e.g. a short sha) and showing badge on the
// footer's GitHub badge.
export function stampGame(html, root, v, badge) {
  const q = "?v=" + v;
  for (const attr of STAMPED) html = swapOnce(html, attr, attr.replace(/"$/, q + '"'), "index.html");
  const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
  for (const f of modules(root)) map.imports[`./js/${f}`] = `./js/${f}${q}`;
  html = withMap(html, map, "index.html");
  return swapOnce(html, '<span id="buildSha">dev</span>', `<span id="buildSha">${badge}</span>`, "index.html");
}

// A grown-up page's index.html (dir: "review/listen", "review/spell", "review/moments" or "review/gallery"), stamped the same way.
export function stampPage(page, root, dir, v, badge) {
  const q = "?v=" + v, where = `${dir}/index.html`, script = (PAGES.find((p) => p[0] === dir) || [])[1];
  const map = { imports: {} };
  for (const f of modules(root)) map.imports[`../../js/${f}`] = `../../js/${f}${q}`;
  page = withMap(page, map, where);
  const extra = (PAGE_EXTRA[dir] || []).map((a) => [a, a.replace(/"$/, q + '"')]);
  for (const [from, to] of [['<span id="buildSha">dev</span>', `<span id="buildSha">${badge}</span>`], [`src="${script}"`, `src="${script}${q}"`], ...extra]) {
    page = swapOnce(page, from, to, where);
  }
  return page;
}

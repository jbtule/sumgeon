// Builds the GitHub Pages site in _site/ from the repo files, stamped with a commit:
//   node scripts/stamp.mjs <full-commit-sha>
// Patterned on sound-box-crosswords' scripts/stamp.mjs.
// - Cache busting: every local file the page loads gets ?v=<short sha>, so a deploy is picked
//   up at once instead of waiting out browser caches: the attributes in STAMPED, and every
//   js/*.js module through the import map (modules import each other by plain relative paths,
//   and the map points each one at its stamped address).
// - The footer's GitHub badge shows the short sha (which version is deployed); it links to
//   the repo's front page (README), not the commit.
// The source files stay runnable as-is; locally the badge just reads "dev".
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const sha = process.argv[2] || "";
if (!/^[0-9a-f]{40}$/.test(sha)) {
  console.error("usage: node scripts/stamp.mjs <full-commit-sha>");
  process.exit(1);
}
const short = sha.slice(0, 7);
const v = "?v=" + short;

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "_site");
// Every file the site serves. New top-level site files go here.
const SITE = ["index.html", "LICENSE.md", "styles.css", "js", "listen", "spell", "moments",
  "manifest.webmanifest", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "social.png"];
// Written by scripts/audio/build.mjs in the deploy; without it the game uses the device voice.
const OPTIONAL = ["audio.json"];
// Attributes in index.html that load a local file, e.g. 'src="js/app.js"'. The icons too:
// browsers, Safari most of all, keep an icon long after it changes, but fetch a new address.
const STAMPED = ['href="styles.css"', 'src="js/app.js"', 'href="manifest.webmanifest"', 'href="favicon.svg"', 'href="apple-touch-icon.png"'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of SITE) cpSync(join(root, f), join(out, f), { recursive: true });
for (const f of OPTIONAL) if (existsSync(join(root, f))) cpSync(join(root, f), join(out, f));
// The manifest's icons, stamped the same way.
const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
manifest.icons = manifest.icons.map((i) => ({ ...i, src: i.src + v }));
writeFileSync(join(out, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");

let html = readFileSync(join(root, "index.html"), "utf8");
// Each replacement must match exactly once, so a markup change can't silently skip one.
function swap(from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`stamp: expected 1 match for ${JSON.stringify(from)}, found ${n}`);
  html = html.replace(from, to);
}

for (const attr of STAMPED) swap(attr, attr.replace(/"$/, v + '"'));

const mapMatch = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
if (!mapMatch) throw new Error("stamp: no import map in index.html");
const map = JSON.parse(mapMatch[1]);
for (const f of readdirSync(join(root, "js")).filter((f) => f.endsWith(".js"))) {
  map.imports[`./js/${f}`] = `./js/${f}${v}`;
}
swap(mapMatch[1], "\n" + JSON.stringify(map, null, 2) + "\n");
swap('<span id="buildSha">dev</span>', `<span id="buildSha">${short}</span>`);

writeFileSync(join(out, "index.html"), html);
// What's deployed, for the game's update check (app.js checkUpdate).
writeFileSync(join(out, "version.json"), JSON.stringify({ sha: short }));

// The grown-up pages (the listen check, the spell check and the Hero Moments review): the same
// badge, their script stamped, and an import map that stamps the game's modules they read, as
// the game's page does. The moments page also loads the game's stylesheet (the strata's walls).
const PAGE_EXTRA = { moments: ['href="../styles.css"'] };
for (const [dir, script] of [["listen", "listen.js"], ["spell", "spell.js"], ["moments", "moments.js"]]) {
  let page = readFileSync(join(root, dir, "index.html"), "utf8");
  const pmap = { imports: {} };
  for (const f of readdirSync(join(root, "js")).filter((f) => f.endsWith(".js"))) pmap.imports[`../js/${f}`] = `../js/${f}${v}`;
  const m = page.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`stamp: no import map in ${dir}/index.html`);
  page = page.replace(m[1], "\n" + JSON.stringify(pmap, null, 2) + "\n");
  const extra = (PAGE_EXTRA[dir] || []).map((a) => [a, a.replace(/"$/, v + '"')]);
  for (const [from, to] of [['<span id="buildSha">dev</span>', `<span id="buildSha">${short}</span>`], [`src="${script}"`, `src="${script}${v}"`], ...extra]) {
    if (page.split(from).length !== 2) throw new Error(`stamp: expected 1 match for ${JSON.stringify(from)} in ${dir}/index.html`);
    page = page.replace(from, to);
  }
  writeFileSync(join(out, dir, "index.html"), page);
}
console.log(`✓ _site/ stamped with ${short}`);

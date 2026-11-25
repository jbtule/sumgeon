// The check, run by CI on every push and PR (npm run check, no install needed):
// syntax of every module, the tests, the import map and the saved-key list.
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
let failed = false;
function fail(msg) { console.error("✗ " + msg); failed = true; }

// Syntax of every module and script.
for (const dir of ["js", "scripts", "listen", "spell", "moments", "gallery"]) {
  for (const f of readdirSync(join(root, dir)).filter((f) => /\.m?js$/.test(f))) {
    try { execFileSync(process.execPath, ["--check", join(root, dir, f)], { stdio: "pipe" }); }
    catch (e) { fail(`${dir}/${f}: ${e.stderr}`); }
  }
}

// The tests.
for (const f of readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".test.mjs")).sort()) {
  try { process.stdout.write(execFileSync(process.execPath, [join(root, "scripts", f)], { encoding: "utf8" })); }
  catch (e) { fail(`${f}\n${e.stdout || ""}${e.stderr || ""}`); }
}

// index.html: an import map, the stamped attributes, and the badge stamp.mjs fills in.
const html = readFileSync(join(root, "index.html"), "utf8");
if (!/<script type="importmap">[\s\S]*?<\/script>/.test(html)) fail("index.html has no import map");
for (const s of ['href="styles.css"', 'src="js/app.js"', '<span id="buildSha">dev</span>']) {
  if (html.split(s).length !== 2) fail(`index.html should have ${s} exactly once`);
}

// Every per-player key the app saves is listed in OWN_KEYS (store.js throws on others; this
// catches a key spelled straight into localStorage).
const app = readFileSync(join(root, "js", "app.js"), "utf8");
if (/localStorage\.(setItem|getItem)\(/.test(app.replace(/window\.localStorage;[^\n]*/, ""))) fail("app.js should save through store.js, not localStorage directly");

// The grown-up pages (the listen check spells out every recorded line; the spell check tries the
// recognizer; the moments page plays Hero Moments; the gallery shows the monster art): search engines skip them, the game never
// links to them, and stamp.mjs can fill in their badge, script and import map.
for (const [dir, script] of [["listen", "listen.js"], ["spell", "spell.js"], ["moments", "moments.js"], ["gallery", "gallery.js"]]) {
  const page = readFileSync(join(root, dir, "index.html"), "utf8");
  if (!page.includes('<meta name="robots" content="noindex, nofollow">')) fail(`${dir}/index.html should be noindex`);
  if (!/<script type="importmap">[\s\S]*?<\/script>/.test(page)) fail(`${dir}/index.html has no import map`);
  for (const s of ['<span id="buildSha">dev</span>', `src="${script}"`]) if (page.split(s).length !== 2) fail(`${dir}/index.html should have ${s} exactly once (stamp.mjs fills it in)`);
  if (new RegExp(dir + "/").test(html) || new RegExp(dir + "/").test(app)) fail(`the game shouldn't link to ${dir}/`);
}

if (failed) process.exit(1);
console.log("✓ check passed");

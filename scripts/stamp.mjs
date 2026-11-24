// Builds the GitHub Pages site in _site/ from the repo files, stamped with a commit:
//   node scripts/stamp.mjs <full-commit-sha>
// Patterned on sound-box-crosswords' scripts/stamp.mjs.
// - Cache busting: every local file the page loads gets ?v=<short sha> (STAMPED below), so a
//   deploy is picked up at once instead of waiting out browser caches. Today the game is one
//   file; add each stylesheet, script and icon to STAMPED as the code splits into modules.
// - The footer's GitHub badge shows the short sha (which version is deployed); it links to
//   the repo's front page (README), not the commit.
// The source files stay runnable as-is; locally the badge just reads "dev".
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync } from "node:fs";
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
const SITE = ["index.html", "LICENSE.md"];
// Attributes in index.html that load a local file, e.g. 'src="js/app.js"'.
const STAMPED = [];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of SITE) cpSync(join(root, f), join(out, f), { recursive: true });

let html = readFileSync(join(root, "index.html"), "utf8");
// Each replacement must match exactly once, so a markup change can't silently skip one.
function swap(from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`stamp: expected 1 match for ${JSON.stringify(from)}, found ${n}`);
  html = html.replace(from, to);
}

for (const attr of STAMPED) swap(attr, attr.replace(/"$/, v + '"'));
swap('<span id="buildSha">dev</span>', `<span id="buildSha">${short}</span>`);

writeFileSync(join(out, "index.html"), html);
console.log(`✓ _site/ stamped with ${short}`);

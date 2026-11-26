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
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { stampGame, stampPage, PAGES } from "./stamping.mjs";

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
const SITE = ["index.html", "LICENSE.md", "styles.css", "js", "review",
  "manifest.webmanifest", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "social.png"];
// Written by scripts/audio/build.mjs in the deploy; without it the game uses the device voice.
const OPTIONAL = ["audio.json"];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of SITE) cpSync(join(root, f), join(out, f), { recursive: true });
for (const f of OPTIONAL) if (existsSync(join(root, f))) cpSync(join(root, f), join(out, f));
// The manifest's icons, stamped the same way.
const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
manifest.icons = manifest.icons.map((i) => ({ ...i, src: i.src + v }));
writeFileSync(join(out, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");

writeFileSync(join(out, "index.html"), stampGame(readFileSync(join(root, "index.html"), "utf8"), root, short, short));
// What's deployed, for the game's update check (app.js checkUpdate).
writeFileSync(join(out, "version.json"), JSON.stringify({ sha: short }));

// The grown-up pages (the listen check, the spell check, the Hero Moments review and the monster
// gallery): the same badge, their script stamped, and an import map that stamps the game's modules they read.
for (const [dir] of PAGES) writeFileSync(join(out, dir, "index.html"), stampPage(readFileSync(join(root, dir, "index.html"), "utf8"), root, dir, short, short));
console.log(`✓ _site/ stamped with ${short}`);

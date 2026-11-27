// A local server for trying the game on a phone (say over `tailscale serve`), with no stale files:
//   node scripts/dev-server.mjs [port]     (default 8791; serves this checkout)
// - Every page is stamped on the fly like the deploy (scripts/stamping.mjs): its script, styles
//   and every js/*.js module get ?v=<version>, where the version changes whenever any file the
//   pages load changes. So a reload always gets new code, even in Safari, which otherwise keeps
//   reusing cached modules. The badge reads "dev".
// - Every response also says not to cache it.
// - Byte ranges work, which the voice needs: a line fetched on its own out of its sprite (_audio/s/, audio.json).
import { createServer } from "node:http";
import { createReadStream, readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { stampGame, stampPage, PAGES } from "./stamping.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.argv[2]) || 8791;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

// The version: the newest change among the files the pages load (js/, styles.css, the pages).
function version() {
  let t = 0;
  const look = (f) => { try { t = Math.max(t, statSync(f).mtimeMs); } catch (e) { /* gone */ } };
  for (const f of readdirSync(join(root, "js"))) look(join(root, "js", f));
  look(join(root, "styles.css")); look(join(root, "index.html"));
  for (const [dir, script] of PAGES) { look(join(root, dir, "index.html")); look(join(root, dir, script)); }
  return "dev" + Math.round(t).toString(36);
}

const send = (res, code, type, body) => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store, max-age=0" }); res.end(body); };

createServer((req, res) => {
  // A bad request (an odd address, a broken escape) gets a 400 instead of taking the server down.
  try { serve(req, res); } catch (e) { try { send(res, 400, "text/plain", "bad request"); } catch (e2) { /* already answered */ } }
}).listen(port, "127.0.0.1", () => console.log(`Sumgeon dev server: http://localhost:${port}/ (pages stamped, nothing cached)`));

function serve(req, res) {
  let path = decodeURIComponent(new URL(req.url.replace(/^\/+/, "/"), "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || file.split(sep).includes(".git")) return send(res, 403, "text/plain", "no");
  if (!existsSync(file) || statSync(file).isDirectory()) return send(res, 404, "text/plain", "not found");
  const ext = extname(file), type = TYPES[ext] || "application/octet-stream";
  // The pages, stamped on the fly.
  const rel = file.slice(root.length).replace(/\\/g, "/").replace(/^\//, "");
  const page = PAGES.find(([dir]) => rel === `${dir}/index.html`);
  if (rel === "index.html" || page) {
    try {
      const html = readFileSync(file, "utf8"), v = version();
      return send(res, 200, type, page ? stampPage(html, root, page[0], v, "dev") : stampGame(html, root, v, "dev"));
    } catch (e) { return send(res, 500, "text/plain", String(e.message)); }
  }
  // Everything else, with byte ranges.
  const size = statSync(file).size, range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  const head = { "Content-Type": type, "Cache-Control": "no-store, max-age=0", "Accept-Ranges": "bytes" };
  if (range) {
    let start = range[1] === "" ? size - Number(range[2]) : Number(range[1]);
    let end = range[1] === "" || range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    if (!(start >= 0 && start <= end)) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { ...head, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    return req.method === "HEAD" ? res.end() : createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, "Content-Length": size });
  return req.method === "HEAD" ? res.end() : createReadStream(file).pipe(res);
}

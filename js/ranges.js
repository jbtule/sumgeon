// A line's bytes in its audio sprite (CLAUDE.md "Sound and voice"): the voice is deployed only as
// sprites, each its clips' MP3 bytes one after another (sprite-v2), with audio.json's map of where
// each line starts and how long it is. A line whose sprite isn't loaded is fetched on its own with
// an HTTP Range request (speech.js, the listen check), and its bytes are exactly its clip. No DOM:
// scripts/ranges.test.mjs.

// The Range header for a line at byte `off`, `len` bytes long: "bytes=11904-22271" (inclusive).
// A single closed range, which the Fetch standard lets go without a CORS preflight.
export function rangeHeader(off, len) {
  return "bytes=" + off + "-" + (off + len - 1);
}

// The line's bytes out of a response to that request: status 206 with exactly len bytes, or a whole
// sprite (status 200, a server that ignored the Range, or the whole file fetched on purpose), cut
// at off. buf: an ArrayBuffer. Returns a new ArrayBuffer of len bytes (decodeAudioData takes it),
// or null when the answer isn't the line.
export function rangeBytes(status, buf, off, len) {
  if (!buf || !(len > 0) || !(off >= 0)) return null;
  if (status === 206) return buf.byteLength === len ? buf.slice(0) : null;
  if (status === 200 || status === 0) return buf.byteLength >= off + len ? buf.slice(off, off + len) : null;
  return null;
}

// Where every line is: { "kind:text": { url, off, len } }, from audio.json's sprites
// ([{ name, url, lines: { id: [off, len] } }]). A line in two (never, sprites.test) keeps the first.
export function linesOf(sprites) {
  const at = {};
  for (const s of sprites || []) for (const id of Object.keys(s.lines || {})) {
    if (!at[id]) at[id] = { url: s.url, off: s.lines[id][0], len: s.lines[id][1] };
  }
  return at;
}

// A Range header's single range against a file of `size` bytes, as { start, end } (inclusive), or
// null if it isn't one range or lies outside the file (sw.js has the same rule, for a cached
// sprite: a classic script can't import this).
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start, end;
  if (m[1] === "") { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  return start <= end && start < size ? { start, end } : null;
}

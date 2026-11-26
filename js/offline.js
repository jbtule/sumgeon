// Offline play (CLAUDE.md "Offline"): the order the voice's sprites are saved in, and what
// Settings → Game says about it. No DOM; the saving itself is in speech.js (saveVoice), the
// caching in sw.js.

// The cache the voice's sprites are kept in (sw.js VOICE_CACHE).
export const VOICE_CACHE = "sumgeon-voice";

// A stratum's sprite families (lines.js runSprites) in the order to save them: its monsters'
// lines first, then its problems lowest level first ("q-kinder-2-add" is level 2), so what a
// player meets first is saved first. Stable otherwise.
export function byLevel(fams) {
  const level = (f) => { const m = /^q-[a-z0-9]+-(\d+)-/i.exec(f); return m ? +m[1] : 0; };
  return fams.map((f, i) => [f, i]).sort((a, b) => level(a[0]) - level(b[0]) || a[1] - b[1]).map((x) => x[0]);
}

// Every sprite, in the order to save it. families: the families wanted first, in order (ALWAYS,
// the current stratum's, then the other open strata's); sprites: audio.json's [{ name, url }],
// whose family is the name without its part (".2"). A family's parts keep audio.json's order, and
// the sprites no family named come last, in audio.json's order, so the whole voice is saved.
// Returns their urls, each once.
export function saveOrder(families, sprites) {
  const fam = (s) => s.name.replace(/\.\d+$/, ""), out = [], seen = new Set();
  const add = (s) => { if (!seen.has(s.url)) { seen.add(s.url); out.push(s.url); } };
  const byFam = {};
  for (const s of sprites) (byFam[fam(s)] = byFam[fam(s)] || []).push(s);
  for (const f of families) (byFam[f] || []).forEach(add);
  sprites.forEach(add);
  return out;
}

const mb = (b) => Math.max(1, Math.round(b / 1e6)) + " MB";
// Settings → Game's line about offline play, from speech.js offlineStatus():
// { supported, ready (the worker controls the page), total, saved, bytes, totalBytes, saving, online }.
export function offlineLine(s) {
  if (!s || !s.supported) return "Offline: not available on this device";
  if (!s.ready) return "Offline: getting the game ready…";
  if (!s.total) return "Offline: ready (no recorded voice here)";
  if (s.saved >= s.total) return `Offline: ready (all ${s.total} voice files, ${mb(s.totalBytes)})`;
  if (s.saving) return `Offline: saving the voice, ${s.saved} of ${s.total} files (${mb(s.bytes)} of ${mb(s.totalBytes)})…`;
  if (s.online === false) return `Offline: ${s.saved} of ${s.total} voice files saved, the rest when back online`;
  return `Offline: ${s.saved} of ${s.total} voice files saved, the rest after a tap`;
}

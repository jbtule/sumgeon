// No DOM. Sealing a linked player's sync record so the sync service (sync/) stores it without
// being able to read or change it (DESIGN.md §15.3). Copied from sound-box-crosswords' seal.js,
// with Sumgeon's own labels, so a key or record from one app means nothing to the other. Only
// the browser's own Web Crypto (also in Node, for the tests).
//
// A link key is 32 random bytes, written as 43 base64url characters: short enough for a
// small QR code, and it travels only in a link's #fragment, which never reaches a server.
// From it, HKDF-SHA-256 makes three things: the lookup ID (all the server sees; it can't work
// back to the key), the AES-256-GCM key that seals the record, and a token sent with every
// request (the server keeps only its hash, and answers reads and saves only with it). A sealed record is
//   [format 1][12-byte random IV][gzip'd JSON, encrypted, with GCM's 16-byte tag]
// and its "additional data" names the lookup ID, the part (Sumgeon keeps one, "p": the whole
// player) and the format, so a record can't be passed off as another player's.
export const FORMAT = 1;
export const KEY_CHARS = 43;
const IV_BYTES = 12;
const enc = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;

export function toB64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(text) {
  const s = atob(String(text).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
export const isKey = (k) => typeof k === "string" && /^[A-Za-z0-9_-]{43}$/.test(k);

export function newKey() {
  return toB64url(globalThis.crypto.getRandomValues(new Uint8Array(32)));
}

// The lookup ID (string), the sealing key (CryptoKey) and the request token for a link key.
export async function keysFor(key) {
  if (!isKey(key)) throw new Error("not a link key");
  const base = await subtle().importKey("raw", fromB64url(key), "HKDF", false, ["deriveBits", "deriveKey"]);
  const hkdf = (label) => ({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode(label) });
  const lookup = toB64url(new Uint8Array(await subtle().deriveBits(hkdf("sumgeon lookup v1"), base, 256)));
  const sealKey = await subtle().deriveKey(hkdf("sumgeon seal v1"), base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  // Sent with every request; the server keeps only its hash and refuses reads and saves without it.
  const writeToken = toB64url(new Uint8Array(await subtle().deriveBits(hkdf("sumgeon write v1"), base, 256)));
  return { lookup, sealKey, writeToken };
}

const aad = (lookup, part) => enc.encode(`sumgeon|${FORMAT}|${lookup}|${part}`);

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function seal(keys, part, value) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const packed = await pipe(enc.encode(JSON.stringify(value)), new CompressionStream("gzip"));
  const sealed = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv, additionalData: aad(keys.lookup, part) }, keys.sealKey, packed));
  const out = new Uint8Array(1 + IV_BYTES + sealed.length);
  out[0] = FORMAT; out.set(iv, 1); out.set(sealed, 1 + IV_BYTES);
  return out;
}

// Throws if the record isn't this player's, or was changed.
export async function unseal(keys, part, bytes) {
  const b = new Uint8Array(bytes);
  if (b[0] !== FORMAT || b.length < 1 + IV_BYTES + 16) throw new Error("not a sealed record");
  const packed = await subtle().decrypt({ name: "AES-GCM", iv: b.subarray(1, 1 + IV_BYTES), additionalData: aad(keys.lookup, part) }, keys.sealKey, b.subarray(1 + IV_BYTES));
  return JSON.parse(new TextDecoder().decode(await pipe(packed, new DecompressionStream("gzip"))));
}

// The link Send shows (and its QR code holds): the site's address with the key after #link=.
// The fragment never reaches a server, not even the game's.
export function linkFor(site, key) { return site.replace(/#.*$/, "") + "#link=" + key; }
export function keyFromLink(text) {
  const m = String(text || "").match(/#link=([A-Za-z0-9_-]{43})(?![A-Za-z0-9_-])/);
  return m ? m[1] : null;
}

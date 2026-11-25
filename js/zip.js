// A tiny .zip writer and reader, "stored" (no compression), with CRC-32. The spell check's
// Record mode shares its drawings as a zip (spell/spell.js), and
// scripts/drawings-to-fixtures.mjs reads one back. No DOM: runs in Node too.
//
//   zip([{ name, data }]) -> Uint8Array   data: Uint8Array or a string (saved as UTF-8)
//   unzip(bytes) -> [{ name, data }]      stored entries only; checks each CRC

const enc = new TextEncoder();
const TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

export function crc32(bytes) {
  if (typeof bytes === "string") bytes = enc.encode(bytes);
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// MS-DOS time and date, as zip headers keep them (local time, 2-second steps).
function dos(d) {
  return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: (Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}

export function zip(files, when = new Date()) {
  const { time, date } = dos(when);
  const entries = files.map((f) => {
    const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data;
    return { name, data, crc: crc32(data) };
  });
  const size = entries.reduce((n, e) => n + 30 + e.name.length + e.data.length + 46 + e.name.length, 22);
  const out = new Uint8Array(size), v = new DataView(out.buffer);
  let at = 0;
  const u16 = (x) => { v.setUint16(at, x, true); at += 2; }, u32 = (x) => { v.setUint32(at, x, true); at += 4; };
  const bytes = (b) => { out.set(b, at); at += b.length; };
  // Version needed 1.0, flag 0x0800 (names are UTF-8), method 0 (stored).
  const common = (e) => { u16(10); u16(0x0800); u16(0); u16(time); u16(date); u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0); };
  for (const e of entries) { e.offset = at; u32(0x04034b50); common(e); bytes(e.name); bytes(e.data); }
  const dir = at;
  for (const e of entries) { u32(0x02014b50); u16(20); common(e); u16(0); u16(0); u16(0); u32(0); u32(e.offset); bytes(e.name); }
  const dirSize = at - dir;
  u32(0x06054b50); u16(0); u16(0); u16(entries.length); u16(entries.length); u32(dirSize); u32(dir); u16(0);
  return out;
}

export function unzip(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), dec = new TextDecoder();
  let end = bytes.length - 22;
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error("unzip: not a zip file");
  const count = v.getUint16(end + 10, true);
  let at = v.getUint32(end + 16, true);
  const files = [];
  for (let i = 0; i < count; i++) {
    if (v.getUint32(at, true) !== 0x02014b50) throw new Error("unzip: bad central directory");
    const method = v.getUint16(at + 10, true), crc = v.getUint32(at + 16, true), size = v.getUint32(at + 20, true);
    const nameLen = v.getUint16(at + 28, true), extra = v.getUint16(at + 30, true), comment = v.getUint16(at + 32, true);
    const offset = v.getUint32(at + 42, true);
    const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    if (method !== 0) throw new Error(`unzip: ${name} is compressed; only stored entries are read`);
    if (v.getUint32(offset, true) !== 0x04034b50) throw new Error(`unzip: bad local header for ${name}`);
    const start = offset + 30 + v.getUint16(offset + 26, true) + v.getUint16(offset + 28, true);
    const data = bytes.slice(start, start + size);
    if (crc32(data) !== crc) throw new Error(`unzip: CRC mismatch in ${name}`);
    files.push({ name, data });
    at += 46 + nameLen + extra + comment;
  }
  return files;
}

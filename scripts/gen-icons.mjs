// Generates the PWA PNG icons into /public with zero dependencies (pure Node + zlib).
// Run: npm run icons
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const C1 = [16, 185, 129]; // emerald
const C2 = [59, 130, 246]; // blue

// Sample one sub-pixel in unit space (0..1). Returns [r,g,b,a] (0..255).
function sample(u, v, { rounded, scale }) {
  // Rounded-square mask
  if (rounded) {
    const r = 0.22, cx = Math.min(Math.max(u, r), 1 - r), cy = Math.min(Math.max(v, r), 1 - r);
    if (Math.hypot(u - cx, v - cy) > r) return [0, 0, 0, 0];
  }
  const t = (u + v) / 2;
  let col = [lerp(C1[0], C2[0], t), lerp(C1[1], C2[1], t), lerp(C1[2], C2[2], t)];
  // Foreground in a centred, scaled space (scale < 1 keeps it inside the maskable safe zone)
  const x = (u - 0.5) / scale, y = (v - 0.5) / scale;
  const d = Math.hypot(x, y);
  let ang = Math.atan2(x, -y); // 0 at top, clockwise
  if (ang < 0) ang += Math.PI * 2;
  const onRing = d > 0.3 && d < 0.39 && ang < Math.PI * 2 * 0.78;
  // Downward arrow (weight going down)
  const stem = Math.abs(x) < 0.045 && y > -0.17 && y < 0.06;
  const head = y >= 0.02 && y < 0.17 && Math.abs(x) < (0.17 - y) * 1.05;
  if (onRing || stem || head) col = [255, 255, 255];
  return [...col, 255];
}

function icon(size, opts) {
  const S = 4; // 4x4 supersampling for anti-aliasing
  return png(size, (px, py) => {
    const acc = [0, 0, 0, 0];
    for (let i = 0; i < S; i++)
      for (let j = 0; j < S; j++) {
        const s = sample((px + (i + 0.5) / S) / size, (py + (j + 0.5) / S) / size, opts);
        acc[0] += s[0] * s[3]; acc[1] += s[1] * s[3]; acc[2] += s[2] * s[3]; acc[3] += s[3];
      }
    const a = acc[3] / (S * S);
    return a === 0 ? [0, 0, 0, 0] : [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3], a].map(Math.round);
  });
}

mkdirSync('public', { recursive: true });
writeFileSync('public/pwa-192.png', icon(192, { rounded: true, scale: 1 }));
writeFileSync('public/pwa-512.png', icon(512, { rounded: true, scale: 1 }));
writeFileSync('public/pwa-512-maskable.png', icon(512, { rounded: false, scale: 0.72 }));
writeFileSync('public/apple-touch-icon.png', icon(180, { rounded: false, scale: 0.85 }));
console.log('Icons written to /public');

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="red" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F87171" />
      <stop offset="100%" stop-color="#DC2626" />
    </linearGradient>
    <linearGradient id="cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />

  <!-- Subtle glow ring -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="4" />

  <!-- Main Gamepad / Arcade Badge -->
  <g filter="url(#shadow)">
    <!-- Dice 1 (Tilt left) -->
    <g transform="translate(140, 160) rotate(-12)">
      <rect x="-55" y="-55" width="110" height="110" rx="22" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3" />
      <circle cx="-25" cy="-25" r="10" fill="#DC2626" />
      <circle cx="25" cy="25" r="10" fill="#DC2626" />
      <circle cx="0" cy="0" r="10" fill="#DC2626" />
      <circle cx="-25" cy="25" r="10" fill="#DC2626" />
      <circle cx="25" cy="-25" r="10" fill="#DC2626" />
    </g>

    <!-- Chess King / Meeple Figure (Center) -->
    <g transform="translate(256, 270)">
      <!-- Meeple base -->
      <path d="M-60,110 C-40,80 -30,60 -25,10 C-35,5 -42,-15 -35,-30 C-30,-40 -15,-45 0,-45 C15,-45 30,-40 35,-30 C42,-15 35,5 25,10 C30,60 40,80 60,110 Z" fill="url(#gold)" />
      <!-- Golden crown on top -->
      <path d="M-22,-45 L-15,-65 L0,-52 L15,-65 L22,-45 Z" fill="#FDE68A" />
      <circle cx="0" cy="-68" r="6" fill="#FDE68A" />
    </g>

    <!-- Star / Play Badge (Top Right) -->
    <g transform="translate(370, 175) rotate(15)">
      <polygon points="0,-45 13,-14 45,-14 20,6 29,38 0,18 -29,38 -20,6 -45,-14 -13,-14" fill="url(#cyan)" />
    </g>

    <!-- Brand Typography / Banner -->
    <g transform="translate(256, 420)">
      <rect x="-140" y="-30" width="280" height="56" rx="28" fill="#1E1B4B" fill-opacity="0.9" stroke="url(#gold)" stroke-width="3" />
      <text x="0" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">FAMPLAY</text>
    </g>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Created public/icon.svg');

// CRC32 table for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // standard filter
  ihdr[12] = 0; // non-interlaced

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filters (filter byte 0)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.46;
  const safeRadius = isMaskable ? width * 0.38 : radius;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Indigo (#4338CA) to Purple (#6D28D9) to Dark Slate (#0F172A)
      const t = (x + y) / (width + height);
      let r = Math.round(67 * (1 - t) + 15 * t);
      let g = Math.round(56 * (1 - t) + 23 * t);
      let b = Math.round(202 * (1 - t) + 42 * t);
      let a = 255;

      // Squircle or Full bleed for maskable
      if (!isMaskable) {
        // Corner radius squircle clip
        const cornerR = width * 0.22;
        const qx = Math.max(0, Math.abs(x - cx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(y - cy) - (cy - cornerR));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0; // Transparent outside squircle
        }
      }

      // If visible, draw golden arcade elements
      if (a > 0) {
        // Center meeple / star silhouette
        const distCenter = Math.hypot(dx, dy + height * 0.05);

        // Dice rectangle on left
        const diceX = cx - width * 0.22;
        const diceY = cy - height * 0.15;
        if (Math.abs(x - diceX) < width * 0.13 && Math.abs(y - diceY) < height * 0.13) {
          r = 255; g = 255; b = 255;
          // red dice dots
          const dotD = Math.hypot(x - diceX, y - diceY);
          if (dotD < width * 0.035) {
            r = 220; g = 38; b = 38;
          }
        }

        // Center golden meeple head
        const headD = Math.hypot(dx, dy + height * 0.12);
        if (headD < width * 0.09) {
          r = 251; g = 191; b = 36; // Amber gold
        }

        // Center golden meeple body
        if (dy > -height * 0.05 && dy < height * 0.22 && Math.abs(dx) < (width * 0.07 + (dy + height * 0.05) * 0.35)) {
          r = 245; g = 158; b = 11;
        }

        // Star on right
        const starX = cx + width * 0.23;
        const starY = cy - height * 0.12;
        const sDist = Math.hypot(x - starX, y - starY);
        if (sDist < width * 0.08) {
          r = 56; g = 189; b = 248; // Cyan
        }

        // Bottom banner
        if (dy > height * 0.26 && dy < height * 0.38 && Math.abs(dx) < width * 0.32) {
          r = 30; g = 27; b = 75; // Deep indigo pill
          // Border glow
          if (Math.abs(dy - height * 0.26) < 3 || Math.abs(dy - height * 0.38) < 3 || Math.abs(Math.abs(dx) - width * 0.32) < 3) {
            r = 245; g = 158; b = 11;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

console.log('Successfully generated all PWA icons (192x192, 512x512, maskable 512x512, apple-touch-icon)');

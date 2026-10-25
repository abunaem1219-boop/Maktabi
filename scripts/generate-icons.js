import fs from 'node:fs';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Raw image scanlines: each line has 1 filter byte (0) + width * 4 (RGBA)
  const lineLength = 1 + width * 4;
  const rawData = Buffer.alloc(lineLength * height);

  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < height; y++) {
    const lineStart = y * lineLength;
    rawData[lineStart] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelStart = lineStart + 1 + x * 4;

      // Squircle distance check
      const dx = Math.max(0, Math.abs(x - cx) - (cx - radius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - radius));
      const dist = Math.hypot(dx, dy);

      if (dist > radius) {
        // Outside squircle: transparent
        rawData[pixelStart + 0] = 0;
        rawData[pixelStart + 1] = 0;
        rawData[pixelStart + 2] = 0;
        rawData[pixelStart + 3] = 0;
        continue;
      }

      // Inside squircle: teal gradient from #0f766e to #115e59
      const gradT = (x + y) / (width + height);
      let r = Math.round(15 * (1 - gradT) + 17 * gradT);
      let g = Math.round(118 * (1 - gradT) + 94 * gradT);
      let b = Math.round(110 * (1 - gradT) + 89 * gradT);
      let a = 255;

      // Anti-aliasing border
      if (dist > radius - 1.5) {
        a = Math.round(255 * (radius - dist) / 1.5);
      }

      // Draw white paper sheet in center
      const paperX1 = size * 0.25;
      const paperX2 = size * 0.75;
      const paperY1 = size * 0.20;
      const paperY2 = size * 0.80;
      const paperRadius = size * 0.04;

      if (x >= paperX1 && x <= paperX2 && y >= paperY1 && y <= paperY2) {
        const pdx = Math.max(0, Math.abs(x - (paperX1 + paperX2) / 2) - ((paperX2 - paperX1) / 2 - paperRadius));
        const pdy = Math.max(0, Math.abs(y - (paperY1 + paperY2) / 2) - ((paperY2 - paperY1) / 2 - paperRadius));
        const pdist = Math.hypot(pdx, pdy);

        if (pdist <= paperRadius) {
          // Paper surface
          r = 255;
          g = 255;
          b = 255;

          // Header accent line (teal)
          if (y >= size * 0.30 && y <= size * 0.33 && x >= size * 0.33 && x <= size * 0.67) {
            r = 13; g = 148; b = 136;
          }
          // Paragraph line 1
          else if (y >= size * 0.38 && y <= size * 0.40 && x >= size * 0.33 && x <= size * 0.63) {
            r = 148; g = 163; b = 184;
          }
          // Paragraph line 2
          else if (y >= size * 0.44 && y <= size * 0.46 && x >= size * 0.33 && x <= size * 0.67) {
            r = 203; g = 213; b = 225;
          }
          // Paragraph line 3
          else if (y >= size * 0.50 && y <= size * 0.52 && x >= size * 0.33 && x <= size * 0.58) {
            r = 203; g = 213; b = 225;
          }
          // Bengali quill / nib golden accent
          else if (x >= size * 0.56 && x <= size * 0.68 && y >= size * 0.56 && y <= size * 0.72) {
            const qx = (x - size * 0.62) / (size * 0.06);
            const qy = (y - size * 0.64) / (size * 0.08);
            if (qx * qx + qy * qy <= 1) {
              r = 234; g = 179; b = 8;
            }
          }
        }
      }

      rawData[pixelStart + 0] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT (Deflated raw scanlines)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png192 = generatePng(192);
fs.writeFileSync('public/icon-192.png', png192);
console.log('Generated public/icon-192.png (' + png192.length + ' bytes)');

const png512 = generatePng(512);
fs.writeFileSync('public/icon-512.png', png512);
console.log('Generated public/icon-512.png (' + png512.length + ' bytes)');

const fs = require('fs');
const width = 32, height = 32;

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const dirEntry = Buffer.alloc(16);
dirEntry[0] = width;
dirEntry[1] = height;
dirEntry[2] = 0;
dirEntry[3] = 0;
dirEntry.writeUInt16LE(1, 4);
dirEntry.writeUInt16LE(32, 6);
dirEntry.writeUInt32LE(width * height * 4 + 40, 8);
dirEntry.writeUInt32LE(22, 12);

const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);
bmpHeader.writeInt32LE(width, 4);
bmpHeader.writeInt32LE(height * 2, 8);
bmpHeader.writeUInt16LE(1, 12);
bmpHeader.writeUInt16LE(32, 14);
bmpHeader.writeUInt32LE(0, 16);
bmpHeader.writeUInt32LE(width * height * 4, 20);
bmpHeader.writeInt32LE(2835, 24);
bmpHeader.writeInt32LE(2835, 28);

const pixelData = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = ((height - 1 - y) * width + x) * 4;
    const cx = x - width/2, cy = y - height/2;
    const dist = Math.sqrt(cx*cx + cy*cy);
    if (dist < width/2 - 2) {
      const t = dist / (width/2);
      pixelData[idx] = Math.round(162 + t * 40);
      pixelData[idx + 1] = Math.round(75 + t * 50);
      pixelData[idx + 2] = Math.round(102 + t * 20);
      pixelData[idx + 3] = 255;
    } else {
      pixelData[idx + 3] = 0;
    }
  }
}

const rowBytes = Math.ceil(width / 32) * 4;
const andMask = Buffer.alloc(rowBytes * height, 0);
const ico = Buffer.concat([header, dirEntry, bmpHeader, pixelData, andMask]);
fs.writeFileSync('public/favicon.ico', ico);
console.log('favicon.ico generated');

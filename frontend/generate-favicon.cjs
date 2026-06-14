const fs = require('fs');

const createFavicon = () => {
  const size = 32;
  const bmpSize = 14 + 40 + size * size * 4;
  const icoSize = 6 + 16 + bmpSize;
  
  const buf = Buffer.alloc(icoSize);
  let o = 0;
  
  buf.writeUInt16LE(0, o); o += 2;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(1, o); o += 2;
  
  buf.writeUInt8(size, o++);
  buf.writeUInt8(size, o++);
  buf.writeUInt8(0, o++);
  buf.writeUInt8(0, o++);
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(32, o); o += 2;
  buf.writeUInt32LE(bmpSize, o); o += 4;
  buf.writeUInt32LE(22, o); o += 4;
  
  buf.write('BM', o); o += 2;
  buf.writeUInt32LE(bmpSize, o); o += 4;
  buf.writeUInt16LE(0, o); o += 2;
  buf.writeUInt16LE(0, o); o += 2;
  buf.writeUInt32LE(54, o); o += 4;
  
  buf.writeUInt32LE(40, o); o += 4;
  buf.writeInt32LE(size, o); o += 4;
  buf.writeInt32LE(size * 2, o); o += 4;
  buf.writeUInt16LE(1, o); o += 2;
  buf.writeUInt16LE(32, o); o += 2;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(size * size * 4, o); o += 4;
  buf.writeInt32LE(2835, o); o += 4;
  buf.writeInt32LE(2835, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  buf.writeUInt32LE(0, o); o += 4;
  
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const cx = size / 2, cy = size / 2;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      let r, g, b;
      if (d < 13) {
        r = 24; g = 144; b = 255;
      } else if (d < 15) {
        r = 255; g = 255; b = 255;
      } else {
        const t = x / size;
        r = Math.round(100 + t * 50);
        g = Math.round(100 + t * 50);
        b = Math.round(120 + t * 50);
      }
      buf.writeUInt8(b, o++);
      buf.writeUInt8(g, o++);
      buf.writeUInt8(r, o++);
      buf.writeUInt8(255, o++);
    }
  }
  
  for (let y = 0; y < size; y++) {
    buf.writeUInt32LE(0, o); o += 4;
  }
  
  return buf;
};

fs.writeFileSync(
  '/Users/chen/Documents/trae_projects/local_projects/may-89083/frontend/public/favicon.ico',
  createFavicon()
);
console.log('favicon.ico created!');

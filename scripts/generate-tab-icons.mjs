import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const iconsDir = path.join(process.cwd(), 'src/static/icons');

const icons = [
  { name: 'tab-home', color: '#999999' },
  { name: 'tab-home-active', color: '#5C6BC0' },
  { name: 'tab-ai', color: '#999999' },
  { name: 'tab-ai-active', color: '#5C6BC0' },
  { name: 'tab-book', color: '#999999' },
  { name: 'tab-book-active', color: '#5C6BC0' },
  { name: 'tab-mine', color: '#999999' },
  { name: 'tab-mine-active', color: '#5C6BC0' },
];

const createSimplePng = (color) => {
  const size = 48;
  const png = Buffer.alloc(8 + 25 + 12 + size * size * 4 + 12 + 12);
  
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  signature.copy(png, 0);
  
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(size, 8);
  ihdr.writeUInt32BE(size, 12);
  ihdr.writeUInt8(8, 16);
  ihdr.writeUInt8(6, 17);
  ihdr.writeUInt8(0, 18);
  ihdr.writeUInt8(0, 19);
  ihdr.writeUInt8(0, 20);
  
  const crc32 = (buf) => {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };
  
  const ihdrData = ihdr.slice(4, 21);
  ihdr.writeUInt32BE(crc32(ihdrData), 21);
  ihdr.copy(png, 8);
  
  const rawData = Buffer.alloc(size * size * 4);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = 255;
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  
  const idat = Buffer.alloc(12 + compressed.length);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatData = idat.slice(4, 8 + compressed.length);
  idat.writeUInt32BE(crc32(idatData), 8 + compressed.length);
  
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
  
  const result = Buffer.concat([signature, ihdr, idat, iend]);
  return result;
};

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

icons.forEach(({ name, color }) => {
  const png = createSimplePng(color);
  fs.writeFileSync(path.join(iconsDir, `${name}.png`), png);
  console.log(`Created ${name}.png`);
});

console.log('All tab icons generated successfully!');
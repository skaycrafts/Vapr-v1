import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const RAW = 'D:/VAPR/public/media/raw';
const OUT = 'C:/Users/muhit/AppData/Local/Temp/claude/D--VAPR/0b4ee4d1-e688-469d-905c-7adfbba7b864/scratchpad';
const cats = process.argv.slice(2);
const CELL = 300, COLS = 5;
for (const cat of cats) {
  const dir = path.join(RAW, cat);
  if (!fs.existsSync(dir)) { console.log('skip', cat); continue; }
  const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).slice(0, 20);
  const tiles = [];
  for (let i = 0; i < files.length; i++) {
    const buf = await sharp(path.join(dir, files[i])).resize(CELL, CELL, { fit: 'cover' }).jpeg({ quality: 72 }).toBuffer();
    tiles.push({ input: buf, left: (i % COLS) * CELL, top: Math.floor(i / COLS) * CELL });
  }
  const rows = Math.ceil(files.length / COLS);
  await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: '#111' } })
    .composite(tiles).jpeg({ quality: 76 }).toFile(path.join(OUT, `sheet_${cat}.jpg`));
  console.log(cat, files.length, files.join(', '));
}

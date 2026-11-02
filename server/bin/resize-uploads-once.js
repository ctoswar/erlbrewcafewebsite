// One-off: downscale oversized gallery/seasonal uploads in place.
// Keeps the original filename (DB references it), writes JPEG for .jpg/.jpeg/.png.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const MAX = 1600;

(async () => {
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpe?g|png)$/i.test(f)) continue;   // only re-encode raster sources; skip .webp (already handled)
    const p = path.join(dir, f);
    const md = await sharp(p).metadata();
    const long = Math.max(md.width || 0, md.height || 0);
    if (!long || long <= MAX) {
      console.log('skip   ', f, `${md.width}x${md.height}`);
      continue;
    }
    const before = fs.statSync(p).size;
    const tmp = p + '.tmp';
    await sharp(p)
      .rotate()
      .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(tmp);
    fs.renameSync(tmp, p);                       // same name → DB + URL untouched
    const after = fs.statSync(p).size;
    const m2 = await sharp(p).metadata();
    console.log('resize ', f, `${md.width}x${md.height} -> ${m2.width}x${m2.height}`,
                `${(before / 1024) | 0}KB -> ${(after / 1024) | 0}KB`);
  }
})().catch(e => { console.error(e); process.exit(1); });

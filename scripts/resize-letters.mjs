import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';

const ALPHABET_DIR = resolve('assets/alphabet');
const MAX_SIZE = 256;
const QUALITY = 75;

async function processDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.endsWith('.webp')) {
      const before = stat.size;
      try {
        // อ่านเป็น buffer ก่อน เพื่อไม่ lock ไฟล์
        const inputBuf = readFileSync(fullPath);
        const outputBuf = await sharp(inputBuf)
          .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer();
        writeFileSync(fullPath, outputBuf);
        const after = outputBuf.length;
        const pct = ((1 - after / before) * 100).toFixed(0);
        console.log(`✅ ${entry}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${pct}%)`);
      } catch (e) {
        console.log(`❌ ${entry}: ${e.message}`);
      }
    }
  }
}

processDir(ALPHABET_DIR);

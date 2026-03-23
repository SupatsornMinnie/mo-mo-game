import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE = path.resolve('assets');

// กำหนดขนาดที่เหมาะสม (2.5x retina)
const CONFIGS = [
  { folder: 'character',  maxSize: 300, quality: 80 },  // แสดง ~120px → 300px
  { folder: 'alphabet',   maxSize: 200, quality: 80 },  // แสดง ~70px → 200px
  { folder: 'home/sea',   maxSize: 1920, quality: 75 }, // พื้นหลังจอ landscape
];

async function optimizeFile(filePath, maxSize, quality) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return;

  const outPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const originalSize = fs.statSync(filePath).size;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // ย่อขนาดถ้าใหญ่เกิน
    let resized = image;
    if (metadata.width > maxSize || metadata.height > maxSize) {
      resized = image.resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true });
    }

    await resized.webp({ quality }).toFile(outPath);

    const newSize = fs.statSync(outPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(
      `${path.basename(filePath).padEnd(20)} ${(originalSize / 1024).toFixed(0).padStart(5)}KB → ${(newSize / 1024).toFixed(0).padStart(5)}KB  (${savings}% smaller)`
    );
  } catch (err) {
    console.error(`Error: ${filePath}:`, err.message);
  }
}

async function processFolder(folder, maxSize, quality) {
  const dir = path.join(BASE, folder);
  if (!fs.existsSync(dir)) {
    console.log(`Folder not found: ${dir}`);
    return;
  }

  console.log(`\n=== ${folder} (max ${maxSize}px, quality ${quality}) ===`);

  const files = fs.readdirSync(dir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .map(f => path.join(dir, f));

  for (const file of files) {
    await optimizeFile(file, maxSize, quality);
  }
}

console.log('Optimizing images...\n');

for (const config of CONFIGS) {
  await processFolder(config.folder, config.maxSize, config.quality);
}

console.log('\nDone!');

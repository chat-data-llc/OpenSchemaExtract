import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const faviconSvg = readFileSync(join(publicDir, "favicon.svg"));
const markSvg = readFileSync(join(publicDir, "logo-mark.svg"), "utf8");

// Favicon-style PNGs (dark square background, white glyph)
const faviconSizes = [32, 64, 128, 192, 256, 512, 1024];
for (const size of faviconSizes) {
  const out = join(publicDir, `logo-${size}.png`);
  await sharp(faviconSvg, { density: size * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
}

// apple-touch-icon (180x180 is the standard)
await sharp(faviconSvg, { density: 720 })
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, "apple-touch-icon.png"));
console.log("wrote apple-touch-icon.png");

// Mark-only black (transparent bg) — replace currentColor with #171717
const markBlackSvg = markSvg.replace(/currentColor/g, "#171717");
writeFileSync(join(publicDir, "_tmp-mark-black.svg"), markBlackSvg);
await sharp(Buffer.from(markBlackSvg), { density: 2048 })
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, "logo-mark-black.png"));
console.log("wrote logo-mark-black.png");

// Mark-only white (transparent bg)
const markWhiteSvg = markSvg.replace(/currentColor/g, "#FFFFFF");
await sharp(Buffer.from(markWhiteSvg), { density: 2048 })
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, "logo-mark-white.png"));
console.log("wrote logo-mark-white.png");

// OG image: 1200x630 with centered logo
const ogBg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#ffffff"/></svg>`
);
const markResized = await sharp(faviconSvg, { density: 4096 })
  .resize(220, 220)
  .png()
  .toBuffer();

await sharp(ogBg)
  .composite([
    { input: markResized, top: 170, left: 490 },
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="120">
          <text x="600" y="70" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="56" font-weight="700" fill="#171717" text-anchor="middle" letter-spacing="-0.02em">OpenSchemaExtract</text>
          <text x="600" y="110" font-family="-apple-system,BlinkMacSystemFont,system-ui,sans-serif" font-size="22" font-weight="400" fill="#737373" text-anchor="middle">Extract structured data from any URL</text>
        </svg>`
      ),
      top: 420,
      left: 0,
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(join(publicDir, "og-image.png"));
console.log("wrote og-image.png");

// Clean up temp file
import { unlinkSync } from "fs";
try {
  unlinkSync(join(publicDir, "_tmp-mark-black.svg"));
} catch {}

console.log("\nAll done.");

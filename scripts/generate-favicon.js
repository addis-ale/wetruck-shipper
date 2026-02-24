/**
 * Generates public/favicon.ico from public/icon.png so browsers that request
 * /favicon.ico get the WeTruck icon instead of a default (e.g. Vercel).
 */
const path = require("path");
const fs = require("fs");

const projectRoot = path.join(__dirname, "..");
const iconPath = path.join(projectRoot, "public", "icon.png");
const faviconPath = path.join(projectRoot, "public", "favicon.ico");

async function main() {
  if (!fs.existsSync(iconPath)) {
    console.error(
      "Missing public/icon.png. Run assets or copy resources/icon.png to public/icon.png first.",
    );
    process.exit(1);
  }
  const sharp = require("sharp");
  const pngToIco = require("png-to-ico");
  // png-to-ico requires a square PNG; resize to 256x256 (contain = fit inside, no crop)
  const squarePng = await sharp(iconPath)
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const buf = await pngToIco(squarePng);
  fs.writeFileSync(faviconPath, buf);
  console.log("Created public/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

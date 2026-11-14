/**
 * Bombay Medical brand assets — every image derived from the supplied logo,
 * assets/brand/source/bombay-medical-logo.png (2172×724, transparent).
 *
 * The logo is a wide lockup: the "BM" monogram, the BOMBAY MEDICAL panel, and
 * two tagline lines. Square places (app icon, favicon, collapsed sidebar) get
 * the monogram letters on their own; everything else gets the full lockup at
 * its own proportions.
 *
 * Outputs:
 *   assets/brand/logo.png       full lockup, 1086 wide (in-app, large)
 *   assets/brand/wordmark.png   full lockup, 720 wide (sidebar, auth header)
 *   assets/brand/mark.png       256  monogram, transparent
 *   assets/icon.png             1024 monogram on cream (iOS rounds it)
 *   assets/adaptive-icon.png    1024 monogram inside Android's safe zone, transparent
 *                                    (background colour: app.json → cream)
 *   assets/splash-icon.png      1024 full lockup, transparent (white splash)
 *   assets/favicon.png          196  monogram on a cream rounded tile
 *
 * Run:  npm i sharp --no-save  &&  node scripts/genIcons.mjs
 */
import sharp from "sharp";

const SRC = "assets/brand/source/bombay-medical-logo.png";
const CREAM = { r: 248, g: 240, b: 216, alpha: 1 }; // the logo's panel, #F8F0D8
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

// The "BM" letters, measured on the source (opaque band y 25–240). Cut before
// the heartbeat line so the square mark stays legible at 16px.
const MONOGRAM = { left: 830, top: 20, width: 290, height: 226 };

const monogram = () => sharp(SRC).extract(MONOGRAM).png().toBuffer();
const lockup = () => sharp(SRC).trim().png().toBuffer();

/** `input` fitted inside `box`×`box` (keeping proportions) and centred on a square canvas. */
async function onSquare(input, size, box, background) {
  const fitted = await sharp(input).resize(box, box, { fit: "inside" }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: "centre" }])
    .png();
}

const roundedTile = (size, r) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="rgb(${CREAM.r},${CREAM.g},${CREAM.b})"/></svg>`,
  );

const mono = await monogram();
const full = await lockup();

await sharp(full).resize({ width: 1086 }).png().toFile("assets/brand/logo.png");
await sharp(full).resize({ width: 720 }).png().toFile("assets/brand/wordmark.png");
await (await onSquare(mono, 256, 232, CLEAR)).toFile("assets/brand/mark.png");
await (await onSquare(mono, 1024, 720, CREAM)).toFile("assets/icon.png");
await (await onSquare(mono, 1024, 560, CLEAR)).toFile("assets/adaptive-icon.png");
await (await onSquare(full, 1024, 940, CLEAR)).toFile("assets/splash-icon.png");

const favMark = await sharp(mono).resize(150, 150, { fit: "inside" }).toBuffer();
await sharp(roundedTile(196, 36))
  .composite([{ input: favMark, gravity: "centre" }])
  .png()
  .toFile("assets/favicon.png");

console.log("Brand assets written.");

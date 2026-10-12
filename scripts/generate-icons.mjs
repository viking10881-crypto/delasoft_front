#!/usr/bin/env node
// scripts/generate-icons.mjs
// Genera los íconos de la PWA a partir del logo fuente (public/brand/delasoft-d.png).
// Reproducible: `node scripts/generate-icons.mjs`. Requiere `sharp` (devDependency).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT   = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "public/brand/delasoft-d.png");
const OUT    = path.join(ROOT, "public/icons");

// El logo fuente es transparente; los íconos necesitan fondo propio para verse
// bien en cualquier launcher. Blanco = mismo tratamiento que ya usa el sidebar.
const BG = { r: 255, g: 255, b: 255, alpha: 1 };

async function trimmedLogoBuffer() {
  return sharp(SOURCE).trim().toBuffer();
}

function roundedMaskSvg(size, radiusRatio = 0.22) {
  const r = Math.round(size * radiusRatio);
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`
  );
}

/** Compone el logo recortado, centrado, sobre un lienzo cuadrado de fondo sólido. */
async function flatSquare(size, logoRatio) {
  const logo = await trimmedLogoBuffer();
  const logoSize = Math.round(size * logoRatio);
  const resizedLogo = await sharp(logo)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toBuffer();
}

/** Ícono "any": fondo blanco + esquinas redondeadas (la plataforma puede recortarlo o no). */
async function buildAnyIcon(size, outName) {
  const flat = await flatSquare(size, 0.78);
  await sharp(flat)
    .composite([{ input: roundedMaskSvg(size), blend: "dest-in" }])
    .png()
    .toFile(path.join(OUT, outName));
}

/** Ícono maskable: a sangre completa, logo dentro de la zona segura central (Android recorta hasta un círculo inscrito). */
async function buildMaskableIcon(size, outName) {
  const flat = await flatSquare(size, 0.5);
  await sharp(flat).png().toFile(path.join(OUT, outName));
}

/** Apple touch icon: cuadrado, sin transparencia (iOS la pinta de negro sólido si la deja). */
async function buildAppleTouchIcon(size, outName) {
  const flat = await flatSquare(size, 0.72);
  await sharp(flat)
    .flatten({ background: BG })
    .png()
    .toFile(path.join(OUT, outName));
}

async function buildFavicon(size, outName) {
  const flat = await flatSquare(size, 0.86);
  await sharp(flat).png().toFile(path.join(OUT, outName));
}

async function main() {
  await mkdir(OUT, { recursive: true });

  await buildAnyIcon(192, "icon-192.png");
  await buildAnyIcon(512, "icon-512.png");
  await buildMaskableIcon(512, "icon-512-maskable.png");
  await buildAppleTouchIcon(180, "apple-touch-icon.png");
  await buildFavicon(32, "favicon-32.png");
  await buildFavicon(16, "favicon-16.png");

  console.log("[icons] Generados en public/icons/");
}

main().catch((err) => {
  console.error("[icons] Error:", err);
  process.exit(1);
});

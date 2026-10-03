// Genera los assets nativos de iOS (AppIcon + Splash) a partir del logo de Te Guio.
//   node scripts/generate-ios-assets.mjs [colorFondoIcono]
// El icono de App Store debe ser 1024x1024 y SIN canal alfa (requisito de Apple).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'src/assets/adaptive-icon-foreground.png';
const ICON_DIR = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
const SPLASH_DIR = 'ios/App/App/Assets.xcassets/Splash.imageset';

const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });

const ICON_BG = hex(process.argv[2] || '#FFFFFF');
const SPLASH_BG = hex('#FFFFFF'); // debe coincidir con SplashScreen.backgroundColor de capacitor.config.json

// Recorta el margen transparente para trabajar con el logo real
const logo = await sharp(SRC).trim({ threshold: 10 }).png().toBuffer();

const compose = async (size, logoRatio, bg, out) => {
  const box = Math.round(size * logoRatio);
  const scaled = await sharp(logo).resize(box, box, { fit: 'inside' }).toBuffer();
  const { width, height } = await sharp(scaled).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: { ...bg, alpha: 1 } } })
    .composite([{ input: scaled, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .flatten({ background: bg })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(out);
};

await mkdir(ICON_DIR, { recursive: true });
await mkdir(SPLASH_DIR, { recursive: true });

await compose(1024, 0.80, ICON_BG, `${ICON_DIR}/AppIcon-512@2x.png`);
console.log('AppIcon-512@2x.png (1024x1024, sin alfa)');

// Capacitor referencia las tres escalas del mismo lienzo cuadrado
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await compose(2732, 0.28, SPLASH_BG, `${SPLASH_DIR}/${f}`);
  console.log(f);
}

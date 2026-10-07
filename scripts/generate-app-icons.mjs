// Genera el icono de la app (Android + iOS/iPadOS) a partir de public/logo-teguio.png.
//   node scripts/generate-app-icons.mjs
//
// El logo trae esquinas redondeadas transparentes y un borde claro. iOS y el icono
// adaptativo de Android (8+) aplican su propia mascara, asi que necesitan una version
// cuadrada y opaca ("full-bleed"): se descartan esquinas y borde y se rellena con el
// degradado azul del propio logo.
//
// Salidas:
//   iOS     AppIcon-512@2x.png 1024x1024 sin canal alfa (requisito de Apple; Xcode deriva iPhone/iPad).
//   Android ic_launcher_foreground: logo full-bleed ocupando el visor de 72dp del lienzo
//           de 108dp, con el sangrado relleno copiando bordes (el launcher recorta circulo/squircle).
//           ic_launcher (legacy, Android 7): el logo tal cual.
//           ic_launcher_round (legacy): full-bleed recortado en circulo.
import sharp from 'sharp';

const SRC = 'public/logo-teguio.png';
const IOS_ICON = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
const ANDROID_RES = 'android/app/src/main/res';
// densidad -> escala respecto a mdpi (48dp legacy, 108dp adaptativo)
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const fullBleed = async (size) => {
  const { data } = await sharp(SRC)
    .resize(size, size, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const N = size * size;

  // 1) Pixeles validos: opacos y a mas de r px de cualquier transparencia
  //    (erosion separable con ventana cuadrada). Descarta esquinas, antialias y borde claro.
  const r = Math.round(size * 0.016);
  const opaque = new Uint8Array(N);
  for (let i = 0; i < N; i++) opaque[i] = data[i * 4 + 3] >= 250 ? 1 : 0;
  const rows = new Uint8Array(N);
  const known = new Uint8Array(N);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ok = 1;
      for (let d = -r; d <= r && ok; d++) {
        const xx = x + d;
        if (xx < 0 || xx >= size || !opaque[y * size + xx]) ok = 0;
      }
      rows[y * size + x] = ok;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ok = 1;
      for (let d = -r; d <= r && ok; d++) {
        const yy = y + d;
        if (yy < 0 || yy >= size || !rows[yy * size + x]) ok = 0;
      }
      known[y * size + x] = ok;
    }
  }

  // 2) Relleno: el fondo del logo es un degradado vertical, asi que cada pixel descartado
  //    toma el color del pixel valido mas cercano de su fila; las filas sin ninguno
  //    copian la fila valida mas cercana.
  const filled = Buffer.alloc(N * 3);
  const rowValid = new Uint8Array(size);
  for (let y = 0; y < size; y++) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < size; x++) {
      if (known[y * size + x]) {
        if (first < 0) first = x;
        last = x;
      }
    }
    if (first < 0) continue;
    rowValid[y] = 1;
    for (let x = 0; x < size; x++) {
      const sx = known[y * size + x] ? x : x < first ? first : x > last ? last : x;
      const s = (y * size + sx) * 4;
      const d = (y * size + x) * 3;
      filled[d] = data[s];
      filled[d + 1] = data[s + 1];
      filled[d + 2] = data[s + 2];
    }
  }
  for (let y = 0; y < size; y++) {
    if (rowValid[y]) continue;
    let src = y;
    for (let d = 1; d < size; d++) {
      if (y - d >= 0 && rowValid[y - d]) { src = y - d; break; }
      if (y + d < size && rowValid[y + d]) { src = y + d; break; }
    }
    filled.copy(filled, y * size * 3, src * size * 3, (src + 1) * size * 3);
  }

  // 3) Suaviza solo la zona rellenada para que no queden vetas
  const blurred = await sharp(filled, { raw: { width: size, height: size, channels: 3 } })
    .blur(size * 0.012)
    .raw()
    .toBuffer();
  const out = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const from = known[i] ? filled : blurred;
    out[i * 3] = from[i * 3];
    out[i * 3 + 1] = from[i * 3 + 1];
    out[i * 3 + 2] = from[i * 3 + 2];
  }
  return sharp(out, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
};

const circleMask = (size) =>
  Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);

const bleed = await fullBleed(1024);

// ── iOS / iPadOS ──
await sharp(bleed).removeAlpha().png({ compressionLevel: 9 }).toFile(IOS_ICON);
console.log(`${IOS_ICON} (1024x1024, sin alfa)`);

// ── Android ──
for (const [density, scale] of Object.entries(DENSITIES)) {
  const dir = `${ANDROID_RES}/mipmap-${density}`;

  const fg = Math.round(108 * scale);
  const visible = Math.round(72 * scale);
  const pad = (fg - visible) / 2;
  await sharp(bleed)
    .resize(visible, visible, { kernel: 'lanczos3' })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'copy' })
    .png({ compressionLevel: 9 })
    .toFile(`${dir}/ic_launcher_foreground.png`);

  const legacy = Math.round(48 * scale);
  await sharp(SRC).resize(legacy, legacy, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${dir}/ic_launcher.png`);
  await sharp(bleed)
    .resize(legacy, legacy, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: circleMask(legacy), blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(`${dir}/ic_launcher_round.png`);

  console.log(`mipmap-${density}: foreground ${fg}px, ic_launcher/_round ${legacy}px`);
}

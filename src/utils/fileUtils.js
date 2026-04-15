const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;

/**
 * Compresses an image file using canvas and returns a small in-memory Blob.
 *
 * Why compression is critical:
 * - CapacitorHttp (enabled) intercepts all HTTP requests on the native app.
 * - To send Blobs in FormData, CapacitorHttp must base64-encode them and pass
 *   them through the WebView bridge (JS → Java/Kotlin).
 * - Phone cameras produce 3-12 MB images → 4-16 MB base64 strings that can
 *   exceed the bridge's message-size limit, causing SILENT data loss.
 * - Compressing to ≤1200px / JPEG 85% yields ~100-300 KB Blobs that
 *   serialize reliably every time.
 *
 * Also handles FileReader/Image errors that the old version silently swallowed.
 */
export const fileToBlob = (file) =>
  new Promise((resolve, reject) => {
    // If it's not an image, fall back to raw ArrayBuffer read (for docs, etc.)
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result], { type: file.type });
        resolve({ blob, name: file.name, preview: URL.createObjectURL(blob) });
      };
      reader.onerror = () => reject(new Error(`No se pudo leer el archivo: ${file.name}`));
      reader.readAsArrayBuffer(file);
      return;
    }

    // Read image → draw on canvas at reduced size → export compressed JPEG/PNG
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer la imagen: ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Imagen no válida: ${file.name}`));
      img.onload = () => {
        // Calculate scaled dimensions (keep aspect ratio, cap at MAX_DIMENSION)
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          } else {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // PNG stays PNG (for transparency); everything else → JPEG
        const isPNG = file.type === 'image/png';
        const outputType = isPNG ? 'image/png' : 'image/jpeg';
        const quality = isPNG ? undefined : JPEG_QUALITY;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error(`Error al comprimir la imagen: ${file.name}`));
              return;
            }
            // Force .jpg extension for converted files so the server gets correct mime
            const ext = isPNG ? '.png' : '.jpg';
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
            const name = `${baseName}${ext}`;
            resolve({ blob, name, preview: URL.createObjectURL(blob) });
          },
          outputType,
          quality,
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

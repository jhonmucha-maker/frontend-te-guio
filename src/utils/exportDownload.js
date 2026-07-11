import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

// Helper unico de descarga de archivos exportados (Excel / PDF).
// - En web: descarga estandar mediante un enlace temporal.
// - En APK Android (Capacitor): guarda el archivo en Documentos via Filesystem.
// Centraliza la logica que antes estaba duplicada inline en cada pagina.

const MIME = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Descarga un archivo exportado recibido como blob/arraybuffer del backend.
 * @param {*} data      response.data de axios (responseType: 'blob')
 * @param {string} baseName  nombre del archivo sin extension (ej: 'compradores')
 * @param {'xlsx'|'pdf'} ext extension/formato
 */
export async function downloadExport(data, baseName, ext) {
  const type = MIME[ext] || 'application/octet-stream';
  const blob = new Blob([data], { type });

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const fileName = `${baseName}_${Date.now()}.${ext}`;
    const base64 = await blobToBase64(blob);
    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents,
    });
    toast.success(`Archivo guardado en Documentos: ${fileName}`);
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${baseName}.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  toast.success('Archivo descargado');
}

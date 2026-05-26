import { useState, useEffect } from 'react';
import { getInstalledVersion } from '../utils/versionCheck';

// Devuelve la version a mostrar en la UI (ej: "1.1").
// - En la app nativa (Android): lee la version REAL instalada via Capacitor
//   (App.getInfo().version === versionName de android/app/build.gradle).
//   Siempre correcta y sin mantenimiento manual: al publicar una nueva
//   version en Play Store, este texto se actualiza solo.
// - En el navegador (panel web): no existe version nativa, asi que se usa el
//   valor inyectado en build desde package.json (__APP_VERSION__, ver vite.config.js).
const WEB_FALLBACK =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '';

export function useAppVersion() {
  const [version, setVersion] = useState(WEB_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    getInstalledVersion().then((info) => {
      if (!cancelled && info?.versionName) {
        setVersion(info.versionName);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}

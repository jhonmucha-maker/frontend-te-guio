import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { versionService } from '../../services/versionService';
import {
  getInstalledVersion,
  isUpdateRequired,
  getCachedResult,
  setCachedResult,
} from '../../utils/versionCheck';
import { useAppResume } from '../../hooks/useAppResume';
import ForceUpdateModal from '../ui/ForceUpdateModal';

// Guard global de actualizacion forzada del aplicativo Android.
//
// Comportamiento:
//  - En web (no nativa): TRANSPARENTE, no interfiere ni consulta nada.
//  - En APK Android:
//      1. Al montar, consulta /api/version contra el backend.
//      2. Si el versionCode instalado es < min_version_code del backend Y
//         force_update_enabled = true, muestra ForceUpdateModal bloqueante.
//      3. Al volver de foreground (useAppResume), re-verifica para detectar
//         que el usuario ya actualizo desde Play Store.
//
// Garantias de no rotura (fail-open):
//  - Si Capacitor no es nativo => no bloquea.
//  - Si @capacitor/app falla => no bloquea.
//  - Si la red falla / timeout / 500 => no bloquea.
//  - Si min_version_code <= 0 => no bloquea.
//  - Si force_update_enabled = false => no bloquea (kill-switch).
//  - El loading inicial NO renderiza children para evitar flash de la app
//    seguido de un modal (mejor UX). Pero el loading es practicamente
//    instantaneo en web (returns early) y en native con cache fresca.
export default function VersionGuard({ children }) {
  const [state, setState] = useState({
    blocked: false,
    title: '',
    message: '',
    playStoreUrl: '',
    ready: false,
  });

  const checkingRef = useRef(false);

  const checkVersion = useCallback(async () => {
    // Evita verificaciones concurrentes (mount + appResume al mismo tiempo).
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      // En web admin u otros navegadores: pasar transparente.
      if (!Capacitor.isNativePlatform()) {
        setState({ blocked: false, title: '', message: '', playStoreUrl: '', ready: true });
        return;
      }

      // Cache local: si una verificacion reciente determino estado, reusarlo
      // para evitar flash y reduccion de hits al backend.
      const cached = getCachedResult();
      if (cached) {
        setState({ ...cached, ready: true });
        return;
      }

      const installed = await getInstalledVersion();
      if (!installed) {
        // No pudimos leer el APK -> fail-open.
        setState({ blocked: false, title: '', message: '', playStoreUrl: '', ready: true });
        return;
      }

      let remote = null;
      try {
        const { data } = await versionService.getAppVersion();
        remote = data?.android || null;
      } catch (err) {
        console.warn('[VersionGuard] /api/version fallo, fail-open:', err?.message);
      }

      const blocked = isUpdateRequired(installed, remote);
      const next = {
        blocked,
        title: remote?.updateTitle || 'Actualizacion requerida',
        message: remote?.updateMessage || '',
        playStoreUrl:
          remote?.playStoreUrl ||
          'https://play.google.com/store/apps/details?id=com.teguio.app',
      };
      setState({ ...next, ready: true });
      setCachedResult(next);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  // Verificacion al montar.
  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  // Re-verificar cuando la app vuelve a foreground (usuario regresa de Play Store).
  useAppResume(checkVersion);

  const handleUpdate = useCallback(async () => {
    const url =
      state.playStoreUrl ||
      'https://play.google.com/store/apps/details?id=com.teguio.app';
    try {
      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Fallback final: navegacion directa.
      try {
        window.location.href = url;
      } catch {
        // No queda mas opcion.
      }
    }
  }, [state.playStoreUrl]);

  // Mientras verifica, no renderizar children evita "flash" de la app
  // seguido de modal. En la mayoria de casos esto dura ms.
  if (!state.ready) return null;

  return (
    <>
      {children}
      <ForceUpdateModal
        open={state.blocked}
        title={state.title}
        message={state.message}
        onUpdate={handleUpdate}
      />
    </>
  );
}

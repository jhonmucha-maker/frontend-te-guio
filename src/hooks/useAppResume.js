import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Ejecuta el callback cuando la app vuelve a foreground.
 * Funciona en browser (visibilitychange) y Capacitor nativo (appStateChange).
 * Incluye dedup de 2s para evitar doble-llamada por ambos eventos.
 */
export function useAppResume(callback) {
  const callbackRef = useRef(callback);
  const lastCallRef = useRef(0);
  callbackRef.current = callback;

  useEffect(() => {
    const invoke = () => {
      const now = Date.now();
      if (now - lastCallRef.current < 2000) return;
      lastCallRef.current = now;
      callbackRef.current();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') invoke();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let appStateHandle;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App: CapApp }) => {
        appStateHandle = CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) invoke();
        });
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      appStateHandle?.then?.((h) => h.remove());
    };
  }, []);
}

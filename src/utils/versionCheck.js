import { Capacitor } from '@capacitor/core';

// Utilidades para el sistema de actualizacion forzada del aplicativo Android.
// - getInstalledVersion(): lee versionCode/versionName del APK instalado via @capacitor/app.
// - isUpdateRequired(installed, remote): decide si la app debe bloquearse.
// - get/setCachedResult(): cache local en localStorage para evitar reconsultas
//   muy seguidas y permitir respuesta instantanea en arranques consecutivos.

const LAST_CHECK_KEY = 'app_version_last_check';
const LAST_RESULT_KEY = 'app_version_last_result';
const CACHE_TTL_MS = 30 * 1000; // 30s

export async function getInstalledVersion() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const code = parseInt(info?.build, 10);
    if (!Number.isFinite(code)) return null;
    return {
      versionCode: code,
      versionName: info?.version || '',
    };
  } catch {
    return null;
  }
}

export function isUpdateRequired(installed, remote) {
  if (!installed || !remote) return false;
  if (!remote.forceUpdateEnabled) return false;
  if (!Number.isFinite(installed.versionCode)) return false;
  if (!Number.isFinite(remote.minVersionCode)) return false;
  if (remote.minVersionCode <= 0) return false;
  return installed.versionCode < remote.minVersionCode;
}

export function getCachedResult() {
  try {
    const ts = parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0', 10);
    if (!Number.isFinite(ts) || Date.now() - ts > CACHE_TTL_MS) return null;
    const raw = localStorage.getItem(LAST_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedResult(result) {
  try {
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
  } catch {
    // localStorage puede fallar en modo privado o cuota llena; ignoramos.
  }
}

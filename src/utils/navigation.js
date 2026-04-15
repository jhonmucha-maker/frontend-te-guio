import { Capacitor } from '@capacitor/core';

/**
 * Opens a URL in the external browser on native platforms,
 * or in a new tab on web. Uses @capacitor/browser when available.
 */
export const openExternal = async (rawUrl) => {
  if (!rawUrl) return;
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch {
      // Fallback if @capacitor/browser is not available
      window.open(url, '_system');
    }
  } else {
    window.open(url, '_blank');
  }
};

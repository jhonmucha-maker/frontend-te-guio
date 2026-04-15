import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import NavigationBar from '../utils/navigationBar';

const THEME_KEY = 'app_theme';

function applyNativeBars(isDark) {
  if (!Capacitor.isNativePlatform()) return;

  if (isDark) {
    // Dark mode: dark status bar with white icons, dark nav bar with light buttons
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#1a1a2e' }).catch(() => {});
    NavigationBar.setThemeColors({
      statusBarColor: '#1a1a2e',
      navBarColor: '#1a1a2e',
      lightStatusIcons: true,
      darkNavButtons: false,
    }).catch(() => {});
  } else {
    // Light mode: purple status bar with white icons, white nav bar with dark buttons
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#312c85' }).catch(() => {});
    NavigationBar.setThemeColors({
      statusBarColor: '#312c85',
      navBarColor: '#FFFFFF',
      lightStatusIcons: true,
      darkNavButtons: true,
    }).catch(() => {});
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);

    // Update color-scheme meta
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme === 'dark' ? 'dark' : 'light';

    // Update native Android system bars
    applyNativeBars(theme === 'dark');
  }, [theme]);

  // Sync with other useTheme instances
  useEffect(() => {
    const handler = (e) => setTheme(e.detail);
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
      });
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}

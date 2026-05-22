import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import NavigationBar from './utils/navigationBar';
import App from './App';
import { AuthProvider } from './features/auth/AuthContext';
import VersionGuard from './components/guards/VersionGuard';
import './styles/tailwind.css';

// Configure status bar style for native platforms.
// Overlay and padding are handled natively in MainActivity.java
// to ensure universal compatibility across all Android versions.
// Theme-aware colors are applied dynamically by useTheme hook.
if (Capacitor.isNativePlatform()) {
  const savedTheme = localStorage.getItem('app_theme') || 'light';
  const isDark = savedTheme === 'dark';
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  StatusBar.setBackgroundColor({ color: isDark ? '#1a1a2e' : '#312c85' }).catch(() => {});

  // Set navigation bar safe area height immediately with a reliable default,
  // then refine with the actual value once the native plugin reports it.
  // 48px = standard 3-button navigation bar on most Android devices.
  document.documentElement.style.setProperty('--android-nav-h', '48px');
  NavigationBar.getInsets().then(({ bottom }) => {
    if (bottom != null && bottom > 0) {
      document.documentElement.style.setProperty('--android-nav-h', `${bottom}px`);
    }
  }).catch(() => {});
}

const TOAST_LIMIT = 3;

function ToastLimiter() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VersionGuard>
          <App />
        </VersionGuard>
        <Toaster
          position="top-right"
          gutter={10}
          containerStyle={{
            // Top offset: respeta status bar Android + notch iOS
            top: 'calc(8px + var(--sat, 0px))',
            // Bottom offset: respeta nav bar Android (--android-nav-h, seteada por NavigationBar plugin)
            // + home indicator iOS (--sab). Garantiza que ningún toast quede bajo la barra de navegación.
            bottom: 'calc(8px + var(--android-nav-h, 0px) + var(--sab, 0px))',
            // z-index sobre el strip body::after (99999) que cubre la nav bar transparente.
            zIndex: 1000000,
          }}
          toastOptions={{
            duration: 2000,
            style: { fontSize: '14px' },
            success: { duration: 2000 },
            error: { duration: 2000 },
          }}
        />
        <ToastLimiter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

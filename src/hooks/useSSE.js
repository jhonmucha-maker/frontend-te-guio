import { useEffect, useRef, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { API_URL } from '../utils/constants';
import { getValidToken } from '../services/apiClient';

export function useSSE(onEvent) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const lastMessageRef = useRef(Date.now());
  onEventRef.current = onEvent;

  const connect = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_URL.replace('/api', '')}/api/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => {
      setConnected(true);
      retryCountRef.current = 0;
      lastMessageRef.current = Date.now();
    };

    es.onmessage = (e) => {
      lastMessageRef.current = Date.now();
      try {
        const data = JSON.parse(e.data);
        if (onEventRef.current) {
          onEventRef.current(data);
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Backoff: 5s, 10s, 20s, max 30s
      const delay = Math.min(5000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;
      retryTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    eventSourceRef.current = es;
  }, []);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  // Reconectar cuando la app vuelve a foreground (Capacitor + browser)
  useEffect(() => {
    // visibilitychange: funciona en browser y Capacitor WebView
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const es = eventSourceRef.current;
        // Si la conexion esta muerta o lleva >45s sin mensajes (keepalive es 30s), reconectar
        if (!es || es.readyState === EventSource.CLOSED || (Date.now() - lastMessageRef.current > 45000)) {
          retryCountRef.current = 0;
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Capacitor appStateChange: se dispara de forma mas fiable en Android nativo
    let appStateHandle;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App: CapApp }) => {
        appStateHandle = CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            const es = eventSourceRef.current;
            if (!es || es.readyState === EventSource.CLOSED || (Date.now() - lastMessageRef.current > 45000)) {
              retryCountRef.current = 0;
              connect();
            }
          }
        });
      }).catch(() => {});
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      appStateHandle?.then?.((h) => h.remove());
    };
  }, [connect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, reconnect: connect, disconnect };
}

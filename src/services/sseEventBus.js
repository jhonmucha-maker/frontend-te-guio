// Bus de eventos SSE singleton - permite que multiples componentes
// escuchen eventos SSE sin abrir conexiones adicionales
const listeners = new Map();

export const sseEventBus = {
  subscribe(eventType, callback) {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, new Set());
    }
    listeners.get(eventType).add(callback);
    return () => {
      const set = listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listeners.delete(eventType);
      }
    };
  },

  emit(eventType, data) {
    const set = listeners.get(eventType);
    if (set) {
      set.forEach(cb => {
        try { cb(data); } catch {}
      });
    }
  },
};

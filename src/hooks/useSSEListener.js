import { useEffect, useRef } from 'react';
import { sseEventBus } from '../services/sseEventBus';

/**
 * Escucha uno o mas eventos SSE y ejecuta el callback.
 * @param {string|string[]} eventTypes - Tipo(s) de evento a escuchar
 * @param {function} callback - Funcion a ejecutar cuando llega el evento
 */
export function useSSEListener(eventTypes, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    const unsubscribers = types.map(type =>
      sseEventBus.subscribe(type, (data) => callbackRef.current(data))
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, [Array.isArray(eventTypes) ? eventTypes.join(',') : eventTypes]);
}

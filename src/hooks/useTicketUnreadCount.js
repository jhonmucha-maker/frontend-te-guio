import { useState, useEffect, useCallback, useRef } from 'react';
import { ticketService } from '../services/ticketService';
import { useSSEListener } from './useSSEListener';
import { useAppResume } from './useAppResume';
import { useAuth } from '../features/auth/useAuth';
import { ROLES } from '../utils/constants';

const TICKET_SSE_EVENTS = [
  'ticket.created',
  'ticket.message.created',
  'ticket.status.updated',
];

export function useTicketUnreadCount() {
  const { usuario } = useAuth();
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await ticketService.getUnreadCount();
      if (mountedRef.current) {
        setCount(data.count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (usuario?.rol === ROLES.COMPRADOR || usuario?.rol === ROLES.VENDEDOR) {
      fetchCount();
    }
    return () => { mountedRef.current = false; };
  }, [usuario?.rol, fetchCount]);

  useSSEListener(TICKET_SSE_EVENTS, fetchCount);
  useAppResume(fetchCount);

  return count;
}

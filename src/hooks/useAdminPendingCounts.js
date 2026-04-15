import { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../services/adminService';
import { useSSEListener } from './useSSEListener';
import { useAppResume } from './useAppResume';
import { useAuth } from '../features/auth/useAuth';
import { ROLES } from '../utils/constants';

export const ADMIN_SSE_EVENTS = [
  'admin.pending.seller',
  'admin.pending.store',
  'admin.pending.product',
  'admin.pending.subscription',
  'ticket.created',
  'ticket.status.updated',
  'ticket.message.created',
  'approval.seller.approved',
  'approval.seller.rejected',
  'approval.store.approved',
  'approval.store.rejected',
  'approval.store.updated',
  'approval.product.approved',
  'approval.product.rejected',
  'approval.product.updated',
  'subscription.request.updated',
];

export function useAdminPendingCounts() {
  const { usuario } = useAuth();
  const [counts, setCounts] = useState({
    pendingSellers: 0,
    pendingStores: 0,
    pendingProducts: 0,
    openTickets: 0,
    pendingSubscriptions: 0,
  });
  const mountedRef = useRef(true);

  const fetchCounts = useCallback(async () => {
    if (usuario?.rol !== ROLES.ADMINISTRADOR) return;
    try {
      const { data } = await adminService.getDashboard();
      if (mountedRef.current) {
        setCounts({
          pendingSellers: data.pendingSellers || 0,
          pendingStores: data.pendingStores || 0,
          pendingProducts: data.pendingProducts || 0,
          openTickets: data.openTickets || 0,
          pendingSubscriptions: data.pendingSubscriptions || 0,
        });
      }
    } catch {}
  }, [usuario?.rol]);

  useEffect(() => {
    mountedRef.current = true;
    if (usuario?.rol === ROLES.ADMINISTRADOR) {
      fetchCounts();
    }
    return () => { mountedRef.current = false; };
  }, [usuario?.rol, fetchCounts]);

  useSSEListener(ADMIN_SSE_EVENTS, fetchCounts);
  useAppResume(fetchCounts);

  return counts;
}

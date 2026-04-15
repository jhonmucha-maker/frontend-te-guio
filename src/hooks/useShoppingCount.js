import { useState, useEffect, useCallback, useRef } from 'react';
import { buyerService } from '../services/buyerService';
import { useSSEListener } from './useSSEListener';
import { useAppResume } from './useAppResume';
import { useAuth } from '../features/auth/useAuth';
import { ROLES } from '../utils/constants';

export function useShoppingCount() {
  const { usuario } = useAuth();
  const [count, setCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await buyerService.getShoppingList();
      const list = data.data || data;
      const items = list.items || [];
      const pendingCount = items.filter((i) => !i.comprado).length;
      if (mountedRef.current) setCount(pendingCount);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (usuario?.rol === ROLES.COMPRADOR) {
      fetchCount();
    }
    return () => { mountedRef.current = false; };
  }, [usuario?.rol, fetchCount]);

  useSSEListener('shopping_list.updated', fetchCount);
  useAppResume(fetchCount);

  return count;
}

import { useState, useCallback } from 'react';

export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Build query params object filtering out empty/null values
  const buildParams = useCallback((extra = {}) => {
    const params = { ...filters, ...extra };
    return Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
  }, [filters]);

  return { filters, setFilter, removeFilter, resetFilters, setFilters, buildParams };
}

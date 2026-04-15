import { useState, useCallback, useMemo } from 'react';

export function usePagination(initialPage = 1, initialLimit = 12) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  const goToPage = useCallback((p) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(page + 1), [page, goToPage]);
  const prevPage = useCallback(() => goToPage(page - 1), [page, goToPage]);
  const resetPage = useCallback(() => setPage(1), []);

  return { page, limit, total, totalPages, setTotal, setLimit, goToPage, nextPage, prevPage, resetPage };
}

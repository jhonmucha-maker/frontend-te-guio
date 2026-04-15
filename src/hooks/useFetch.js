import { useState, useEffect, useCallback } from 'react';

export function useFetch(apiFunction, params = null, autoFetch = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetch = useCallback(
    async (overrideParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunction(overrideParams ?? params);
        setData(response.data);
        return response.data;
      } catch (err) {
        const message =
          err.response?.data?.error || err.message || 'Error inesperado';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, params]
  );

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, []);

  return { data, loading, error, refetch: fetch };
}

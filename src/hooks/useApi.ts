import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/utils/apiClient';

interface UseGetResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: (newParams?: Record<string, unknown>) => Promise<T | undefined>;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables?: TVariables) => Promise<TData | undefined>;
  loading: boolean;
  error: Error | null;
}

export function useGet<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  autoFetch = true,
): UseGetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (newParams?: Record<string, unknown>): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<T>(url, newParams ?? params);
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('未知错误'));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [url, params],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePost<TData = unknown, TVariables = unknown>(
  url: string,
): UseMutationResult<TData, TVariables> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables?: TVariables): Promise<TData | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.post<TData>(url, variables);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('未知错误'));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { mutate, loading, error };
}

export function usePut<TData = unknown, TVariables = unknown>(
  url: string,
): UseMutationResult<TData, TVariables> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables?: TVariables): Promise<TData | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.put<TData>(url, variables);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('未知错误'));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { mutate, loading, error };
}

export function useDelete<TData = unknown>(
  url: string,
): UseMutationResult<TData, void> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (): Promise<TData | undefined> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.del<TData>(url);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { mutate, loading, error };
}

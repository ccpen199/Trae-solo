import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import api from '../lib/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useGet<T>(
  queryKey: string[],
  url: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>, Error, T, string[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<never, ApiResponse<T>>(url);
      return response;
    },
    select: (response) => response.data as T,
    ...options,
  });
}

export function useGetPaginated<T>(
  queryKey: string[],
  url: string,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedData<T>>, Error, PaginatedData<T>, string[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get<never, ApiResponse<PaginatedData<T>>>(url);
      return response;
    },
    select: (response) => response.data as PaginatedData<T>,
    ...options,
  });
}

export function usePost<TData, TResponse>(
  options?: Omit<UseMutationOptions<ApiResponse<TResponse>, Error, { url: string; data: TData }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data: TData }) => {
      const response = await api.post<never, ApiResponse<TResponse>>(url, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

export function usePut<TData, TResponse>(
  options?: Omit<UseMutationOptions<ApiResponse<TResponse>, Error, { url: string; data: TData }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, data }: { url: string; data: TData }) => {
      const response = await api.put<never, ApiResponse<TResponse>>(url, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

export function useDelete<TResponse>(
  options?: Omit<UseMutationOptions<ApiResponse<TResponse>, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await api.delete<never, ApiResponse<TResponse>>(url);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    ...options,
  });
}

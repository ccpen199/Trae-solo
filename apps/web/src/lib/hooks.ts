import useSWR from 'swr';
import type { SWRConfiguration } from 'swr';
import api from './api';
import type {
  User,
  ProductSPU,
  Order,
  FlashSale,
  Post,
  AdoptionPost,
  PaginationResult,
  ProductCategoryNode,
} from '@pet/shared/types';

const fetcher = (url: string) => api.get(url).then((res) => res);

function useSWRWithConfig<T>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    ...config,
  });
}

export function useUser() {
  return useSWRWithConfig<User>('/user/profile', {
    onErrorRetry: (error) => {
      if (error.message === 'Unauthorized') return;
    },
  });
}

export function useProducts(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.keyword) searchParams.set('keyword', params.keyword);
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  const query = searchParams.toString();
  return useSWRWithConfig<PaginationResult<ProductSPU>>(
    `/product-spu?${query}`
  );
}

export function useProduct(id: string | null) {
  return useSWRWithConfig<ProductSPU>(id ? `/product-spu/${id}` : null);
}

export function useCategories() {
  return useSWRWithConfig<ProductCategoryNode[]>('/product-category/tree');
}

export function useOrders(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  return useSWRWithConfig<PaginationResult<Order>>(`/order?${query}`);
}

export function useOrder(id: string | null) {
  return useSWRWithConfig<Order>(id ? `/order/${id}` : null);
}

export function useFlashSales(params?: { status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  return useSWRWithConfig<FlashSale[]>(`/flash-sale?${query}`);
}

export function usePosts(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  topicId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.topicId) searchParams.set('topicId', params.topicId);
  const query = searchParams.toString();
  return useSWRWithConfig<PaginationResult<Post>>(`/post?${query}`);
}

export function useAdoptions(params?: {
  page?: number;
  pageSize?: number;
  petType?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.petType) searchParams.set('petType', params.petType);
  const query = searchParams.toString();
  return useSWRWithConfig<PaginationResult<AdoptionPost>>(`/adoption?${query}`);
}

export function useCart() {
  return useSWRWithConfig<{ items: import('@pet/shared/types').CartItem[]; total: number }>('/cart');
}

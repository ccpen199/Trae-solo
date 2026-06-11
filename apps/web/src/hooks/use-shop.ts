import useSWR from 'swr';
import { fetcher, ENDPOINTS } from '@/lib/api';
import type {
  ProductSPU,
  ProductCategoryNode,
  FlashSale,
  Order,
  UserCoupon,
  PaginationResult,
} from '@pet/shared/types';

export function useProducts(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return useSWR<PaginationResult<ProductSPU>>(
    ENDPOINTS.product.list(params),
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useProduct(id: string) {
  return useSWR<ProductSPU>(
    id ? ENDPOINTS.product.detail(id) : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useCategoryTree() {
  return useSWR<ProductCategoryNode[]>(
    ENDPOINTS.category.tree(),
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useCategoryChildren(id: string) {
  return useSWR<ProductCategoryNode[]>(
    id ? ENDPOINTS.category.children(id) : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useFlashSales(params?: Record<string, unknown>) {
  return useSWR<PaginationResult<FlashSale>>(
    ENDPOINTS.flashSale.list(params),
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useFlashSale(id: string) {
  return useSWR<FlashSale>(
    id ? ENDPOINTS.flashSale.detail(id) : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useOrders(params?: Record<string, unknown>) {
  return useSWR<PaginationResult<Order>>(
    ENDPOINTS.order.list(params),
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useOrder(id: string) {
  return useSWR<Order>(
    id ? ENDPOINTS.order.detail(id) : null,
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useCoupons() {
  return useSWR<UserCoupon[]>(
    ENDPOINTS.coupon.list(),
    fetcher,
    { revalidateOnFocus: false },
  );
}

export function useAvailableCoupons() {
  return useSWR<UserCoupon[]>(
    ENDPOINTS.coupon.available(),
    fetcher,
    { revalidateOnFocus: false },
  );
}

import { get, post, put } from '../api';
import type { 
  PaginatedResponse, Product, ProductTraceNode, InventoryItem, 
  Promotion, TraceRecord 
} from '../../../shared/types';

export async function getProducts(params?: { page?: number; pageSize?: number; category?: string; keyword?: string }) {
  return get<PaginatedResponse<Product>>('/goods/products', params);
}

export async function getProduct(id: number) {
  return get<Product>(`/goods/products/${id}`);
}

export async function getProductTrace(productId: number) {
  return get<ProductTraceNode[]>(`/goods/trace/${productId}`);
}

export async function getInventory(params?: { page?: number; pageSize?: number; warehouseId?: string }) {
  return get<InventoryItem[]>('/goods/inventory', params);
}

export async function getInventorySummary() {
  return get<{ totalStock: number; totalValue: number; lowStockCount: number; warehouseCount: number }>('/goods/inventory/summary');
}

export async function updateInventory(id: number, data: { stock: number }) {
  return put<{ updated: boolean }>(`/goods/inventory/${id}`, data);
}

export async function syncInventory(data: { inventoryId: number; quantity: number }) {
  return post<{ synced: boolean }>('/goods/inventory/sync', data);
}

export async function getPromotions() {
  return get<Promotion[]>('/goods/promotions');
}

export async function createPromotion(data: Omit<Promotion, 'id'>) {
  return post<{ created: boolean; id: number }>('/goods/promotions', data);
}

export async function updatePromotion(id: number, data: Partial<Promotion>) {
  return put<{ updated: boolean }>(`/goods/promotions/${id}`, data);
}

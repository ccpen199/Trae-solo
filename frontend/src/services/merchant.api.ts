import { http } from './request';
import type {
  Order,
  Merchant,
  PaginatedResponse,
  PaginationParams,
} from '../types';

export interface MerchantDashboard {
  todayOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalOrders: number;
  rating: number;
}

export interface RegisterMerchantParams {
  shopName: string;
  shopType: string;
  shopAddress?: string;
  businessLicense?: string;
  shopLogo?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  status: 'on' | 'off';
  createdAt: string;
}

export interface AddProductParams {
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
}

export interface MerchantStats {
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  topProducts: Array<{ productId: string; productName: string; count: number }>;
}

export interface MerchantFinance {
  balance: number;
  totalRevenue: number;
  pendingSettlement: number;
  settlements: Array<{ date: string; amount: number; orders: number }>;
}

export const merchantApi = {
  registerMerchant(params: RegisterMerchantParams): Promise<Merchant> {
    return http.post<Merchant>('/merchant/register', params);
  },

  getDashboard(): Promise<MerchantDashboard> {
    return http.get<MerchantDashboard>('/merchant/dashboard');
  },

  getOrders(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/merchant/orders', params);
  },

  acceptOrder(id: string): Promise<Order> {
    return http.post<Order>(`/merchant/orders/${id}/accept`);
  },

  rejectOrder(id: string, reason?: string): Promise<void> {
    return http.post<void>(`/merchant/orders/${id}/reject`, { reason });
  },

  getProducts(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    return http.get<PaginatedResponse<Product>>('/merchant/products', params);
  },

  addProduct(params: AddProductParams): Promise<Product> {
    return http.post<Product>('/merchant/products', params);
  },

  updateProduct(id: string, params: Partial<AddProductParams>): Promise<Product> {
    return http.put<Product>(`/merchant/products/${id}`, params);
  },

  getStats(params?: { period?: 'week' | 'month' }): Promise<MerchantStats> {
    return http.get<MerchantStats>('/merchant/stats', params);
  },

  getFinance(): Promise<MerchantFinance> {
    return http.get<MerchantFinance>('/merchant/finance');
  },

  getProfile(): Promise<Merchant> {
    return http.get<Merchant>('/merchant/profile');
  },
};

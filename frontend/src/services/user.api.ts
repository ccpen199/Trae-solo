import { http } from './request';
import type {
  Order,
  Address,
  Review,
  DisputeTicket,
  PaginatedResponse,
  PaginationParams,
  Coupon,
} from '../types';

export interface CreateOrderParams {
  category: string;
  title: string;
  description?: string;
  pickupAddress: string;
  pickupLocation: { lat: number; lng: number };
  pickupName?: string;
  pickupPhone?: string;
  deliveryAddress: string;
  deliveryLocation: { lat: number; lng: number };
  deliveryName: string;
  deliveryPhone: string;
  weight?: number;
  goodsValue?: number;
  tip?: number;
}

export interface ReviewOrderParams {
  orderId: string;
  rating: number;
  content?: string;
  images?: string[];
}

export interface CreateDisputeParams {
  orderId: string;
  type: string;
  title: string;
  description: string;
  evidence?: string[];
}

export interface CreateAddressParams {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  fullAddress: string;
  location: { lat: number; lng: number };
  isDefault?: boolean;
  tag?: string;
}

export interface UpdateAddressParams extends Partial<CreateAddressParams> {
  id: string;
}

export interface UpdateProfileParams {
  nickname?: string;
  avatar?: string;
}

export interface WalletInfo {
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

export const userApi = {
  getOrders(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/user/orders', params);
  },

  getOrderDetail(id: string): Promise<Order> {
    return http.get<Order>(`/user/orders/${id}`);
  },

  createOrder(params: CreateOrderParams): Promise<Order> {
    return http.post<Order>('/user/orders', params);
  },

  cancelOrder(id: string, reason?: string): Promise<void> {
    return http.post<void>(`/user/orders/${id}/cancel`, { reason });
  },

  reviewOrder(params: ReviewOrderParams): Promise<Review> {
    return http.post<Review>('/user/reviews', params);
  },

  createDispute(params: CreateDisputeParams): Promise<DisputeTicket> {
    return http.post<DisputeTicket>('/user/disputes', params);
  },

  getAddresses(): Promise<Address[]> {
    return http.get<Address[]>('/user/addresses');
  },

  addAddress(params: CreateAddressParams): Promise<Address> {
    return http.post<Address>('/user/addresses', params);
  },

  updateAddress(params: UpdateAddressParams): Promise<Address> {
    return http.put<Address>(`/user/addresses/${params.id}`, params);
  },

  deleteAddress(id: string): Promise<void> {
    return http.delete<void>(`/user/addresses/${id}`);
  },

  getWallet(): Promise<WalletInfo> {
    return http.get<WalletInfo>('/user/wallet');
  },

  getCoupons(): Promise<Coupon[]> {
    return http.get<Coupon[]>('/user/coupons');
  },

  getProfile(): Promise<import('../types').User> {
    return http.get<import('../types').User>('/user/profile');
  },

  updateProfile(params: UpdateProfileParams): Promise<import('../types').User> {
    return http.put<import('../types').User>('/user/profile', params);
  },
};

import type { ApiResponse, Product, Order, OrderItem, User, PaginatedResponse, PaginationParams, Inventory, Wastage, DeliveryException, Rider, ColdChainVehicle, DispatchResult, Claim, ClaimStats, ShopRating, HotProduct, ShopSalesRanking, DashboardStats } from '../../shared/types';

const BASE_URL = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json() as ApiResponse<T>;
  
  if (!data.success) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data.data as T;
}

export const api = {
  products: {
    list: (params?: { festival?: string; scene?: string; minPrice?: number; maxPrice?: number } & PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.festival) searchParams.append('festival', params.festival);
      if (params?.scene) searchParams.append('scene', params.scene);
      if (params?.minPrice !== undefined) searchParams.append('minPrice', String(params.minPrice));
      if (params?.maxPrice !== undefined) searchParams.append('maxPrice', String(params.maxPrice));
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Product>>(`/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    get: (id: number) => request<Product>(`/products/${id}`),
  },

  orders: {
    list: (params?: PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Order>>(`/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    get: (id: string) => request<Order & { items: OrderItem[] }>(`/orders/${id}`),
    create: (data: {
      shopId: number;
      items: { productId: number; quantity: number; price: number }[];
      recipientName: string;
      recipientPhone: string;
      recipientAddress: string;
      recipientLat: number;
      recipientLng: number;
      deliveryType: 'instant' | 'next-day';
      expectedDeliveryTime: string;
    }) => request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getLogistics: (orderId: string) => request<Array<{ id: number; type: string; name: string; timestamp: string; status: string; temperature?: number }>>(`/orders/${orderId}/logistics`),
    updateStatus: (orderId: string, status: string, riderId?: number) => request<Order>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, riderId }),
    }),
    listByShop: (shopId: number, params?: PaginationParams & { status?: string }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('shopId', String(shopId));
      if (params?.status) searchParams.append('status', params.status);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Order>>(`/orders?${searchParams.toString()}`);
    },
  },

  inventory: {
    list: (shopId: number, params?: PaginationParams) => {
      const searchParams = new URLSearchParams();
      searchParams.append('shopId', String(shopId));
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Inventory>>(`/inventory?${searchParams.toString()}`);
    },
    recordWastage: (data: { shopId: number; productId: number; batchNo: string; quantity: number; reason: string }) => request<Wastage>('/inventory/wastage', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getWastageList: (shopId: number, params?: PaginationParams) => {
      const searchParams = new URLSearchParams();
      searchParams.append('shopId', String(shopId));
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Wastage>>(`/inventory/wastage?${searchParams.toString()}`);
    },
  },

  exceptions: {
    list: (params?: PaginationParams & { orderId?: string; type?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.orderId) searchParams.append('orderId', params.orderId);
      if (params?.type) searchParams.append('type', params.type);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<DeliveryException>>(`/exceptions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    create: (data: { orderId: string; type: string; description: string; evidence?: string; reportedBy: number }) => request<DeliveryException>('/exceptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  auth: {
    login: (phone: string, code: string) => request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
    getCurrentUser: () => request<User>('/auth/me'),
    sendCode: (phone: string) => request<void>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  },

  user: {
    get: () => request<User>('/user'),
  },

  dispatch: {
    getPendingOrders: () => request<Order[]>('/dispatch/pending'),
    assignOrder: (orderId: string) => request<DispatchResult>(`/dispatch/assign/${orderId}`, {
      method: 'POST',
    }),
    getRiders: (params?: { isOnline?: boolean } & PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.isOnline !== undefined) searchParams.append('isOnline', String(params.isOnline));
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Rider>>(`/dispatch/riders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    getTemperatureMonitoring: () => request<ColdChainVehicle[]>('/dispatch/temperature'),
  },

  claims: {
    list: (params?: { status?: string; type?: string; orderId?: string } & PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.type) searchParams.append('type', params.type);
      if (params?.orderId) searchParams.append('orderId', params.orderId);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<Claim>>(`/claims${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    getStats: () => request<ClaimStats>('/claims/stats'),
    review: (claimId: number, action: 'approve' | 'reject') => request<Claim>(`/claims/${claimId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    }),
  },

  admin: {
    getDashboard: () => request<DashboardStats>('/admin/dashboard'),
    getRatings: () => request<ShopRating[]>('/admin/ratings'),
    getHotProducts: (params?: { city?: string; district?: string; category?: string } & PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.city) searchParams.append('city', params.city);
      if (params?.district) searchParams.append('district', params.district);
      if (params?.category) searchParams.append('category', params.category);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<HotProduct>>(`/admin/hot-products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
    getSalesRanking: (params?: { city?: string; district?: string } & PaginationParams) => {
      const searchParams = new URLSearchParams();
      if (params?.city) searchParams.append('city', params.city);
      if (params?.district) searchParams.append('district', params.district);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
      
      return request<PaginatedResponse<ShopSalesRanking>>(`/admin/sales-ranking${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    },
  },
};

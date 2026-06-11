import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const fetcher = (url: string) => api.get(url).then((res) => res);

export const ENDPOINTS = {
  product: {
    list: (params?: Record<string, unknown>) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return `/product/spus${query}`;
    },
    detail: (id: string) => `/product/spus/${id}`,
  },
  category: {
    tree: () => '/product/categories/tree',
    detail: (id: string) => `/product/categories/${id}`,
    children: (id: string) => `/product/categories/${id}/children`,
  },
  flashSale: {
    list: (params?: Record<string, unknown>) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return `/flash-sales${query}`;
    },
    detail: (id: string) => `/flash-sales/${id}`,
    items: (id: string) => `/flash-sales/${id}/items`,
    purchase: () => '/flash-sales/purchase',
  },
  order: {
    list: (params?: Record<string, unknown>) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return `/orders${query}`;
    },
    detail: (id: string) => `/orders/${id}`,
    create: () => '/orders',
    cancel: () => '/orders/cancel',
    confirmReceive: () => '/orders/confirm-receive',
  },
  cart: {
    list: () => '/cart',
    add: () => '/cart/add',
    update: (id: string) => `/cart/${id}`,
    remove: (id: string) => `/cart/${id}`,
  },
  coupon: {
    list: () => '/coupons',
    receive: (id: string) => `/coupons/${id}/receive`,
    available: () => '/coupons/available',
  },
  address: {
    list: () => '/users/addresses',
    detail: (id: string) => `/users/addresses/${id}`,
    create: () => '/users/addresses',
    update: (id: string) => `/users/addresses/${id}`,
    delete: (id: string) => `/users/addresses/${id}`,
    setDefault: (id: string) => `/users/addresses/${id}/default`,
  },
};

export default api;

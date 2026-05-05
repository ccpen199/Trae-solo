import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  register: (data: { username: string; email: string; password: string; phone?: string }) =>
    api.post<ApiResponse>('/users/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse>('/users/login', data),
  
  getProfile: () =>
    api.get<ApiResponse>('/users/profile'),
  
  updateProfile: (data: { email?: string; phone?: string }) =>
    api.put<ApiResponse>('/users/profile', data),
  
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post<ApiResponse>('/users/change-password', data),
  
  getAddresses: () =>
    api.get<ApiResponse>('/users/addresses'),
  
  addAddress: (data: any) =>
    api.post<ApiResponse>('/users/addresses', data),
  
  updateAddress: (id: string, data: any) =>
    api.put<ApiResponse>(`/users/addresses/${id}`, data),
  
  deleteAddress: (id: string) =>
    api.delete<ApiResponse>(`/users/addresses/${id}`),
};

export const bookApi = {
  getBooks: (params?: any) =>
    api.get<ApiResponse>('/books', { params }),
  
  getBookById: (id: string) =>
    api.get<ApiResponse>(`/books/${id}`),
  
  getNewBooks: (limit?: number) =>
    api.get<ApiResponse>('/books/new', { params: { limit } }),
  
  getCategories: () =>
    api.get<ApiResponse>('/books/categories'),
  
  getAuthors: () =>
    api.get<ApiResponse>('/books/authors'),
  
  getPublishers: () =>
    api.get<ApiResponse>('/books/publishers'),
};

export const cartApi = {
  getCart: () =>
    api.get<ApiResponse>('/cart'),
  
  addToCart: (data: { bookId: string; quantity?: number }) =>
    api.post<ApiResponse>('/cart', data),
  
  updateCartItem: (id: string, data: { quantity: number }) =>
    api.put<ApiResponse>(`/cart/${id}`, data),
  
  removeFromCart: (id: string) =>
    api.delete<ApiResponse>(`/cart/${id}`),
  
  clearCart: () =>
    api.delete<ApiResponse>('/cart'),
};

export const orderApi = {
  createOrder: (data: { addressId?: string; remark?: string }) =>
    api.post<ApiResponse>('/orders', data),
  
  getMyOrders: (params?: { status?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse>('/orders', { params }),
  
  getOrderById: (id: string) =>
    api.get<ApiResponse>(`/orders/${id}`),
  
  cancelOrder: (id: string) =>
    api.post<ApiResponse>(`/orders/${id}/cancel`),
};

export const newsApi = {
  getNews: (params?: { type?: string; isScroll?: boolean; limit?: number }) =>
    api.get<ApiResponse>('/news', { params }),
  
  getNewsById: (id: string) =>
    api.get<ApiResponse>(`/news/${id}`),
};

export const adminApi = {
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse>('/admin/login', data),
  
  getBooks: (params?: any) =>
    api.get<ApiResponse>('/admin/books', { params }),
  
  createBook: (data: any) =>
    api.post<ApiResponse>('/admin/books', data),
  
  updateBook: (id: string, data: any) =>
    api.put<ApiResponse>(`/admin/books/${id}`, data),
  
  getOrders: (params?: any) =>
    api.get<ApiResponse>('/admin/orders', { params }),
  
  getOrderDetail: (id: string) =>
    api.get<ApiResponse>(`/admin/orders/${id}`),
  
  updateOrderStatus: (id: string, data: { status: string }) =>
    api.put<ApiResponse>(`/admin/orders/${id}/status`, data),
  
  getUsers: (params?: { keyword?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse>('/admin/users', { params }),
  
  getUserOrders: (userId: string) =>
    api.get<ApiResponse>(`/admin/users/${userId}/orders`),
  
  getCategories: () =>
    api.get<ApiResponse>('/admin/categories'),
  
  createCategory: (data: any) =>
    api.post<ApiResponse>('/admin/categories', data),
  
  updateCategory: (id: string, data: any) =>
    api.put<ApiResponse>(`/admin/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    api.delete<ApiResponse>(`/admin/categories/${id}`),
};

export default api;

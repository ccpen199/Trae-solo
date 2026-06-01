import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  categories: [],
  currentCategory: null,
  searchParams: {},
  toast: null,

  setSearchParams: (params) => set({ searchParams: { ...get().searchParams, ...params } }),

  login: async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  register: async (phone, password, nickname, user_type) => {
    const { data } = await api.post('/auth/register', { phone, password, nickname, user_type });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchCurrentUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch (e) {
      localStorage.removeItem('token');
      set({ token: null });
    }
  },

  fetchCategories: async () => {
    const { data } = await api.get('/categories/tree');
    set({ categories: data.categories });
  },

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  }
}));

export default api;

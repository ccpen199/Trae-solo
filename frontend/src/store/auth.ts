
import { create } from 'zustand';
import axios from 'axios';

export interface User {
  id: number;
  username: string;
  real_name: string;
  phone: string;
  email: string;
  role: 'admin' | 'user' | 'company';
  credit_score: number;
  exposure_weight: number;
  total_recommendations: number;
  success_hires: number;
  total_commission: number;
  company?: {
    id: number;
    company_name: string;
    industry: string;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  isAuthenticated: boolean;
}

const getToken = () => localStorage.getItem('headhunter_token');
const setToken = (token: string) => localStorage.setItem('headhunter_token', token);
const removeToken = () => localStorage.removeItem('headhunter_token');

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),

  login: async (username: string, password: string) => {
    const response = await axios.post('/api/auth/login', { username, password });
    const { token, user } = response.data;
    setToken(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const response = await axios.get('/api/auth/me');
      set({ user: response.data, isAuthenticated: true });
    } catch (error) {
      removeToken();
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

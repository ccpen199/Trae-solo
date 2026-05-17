import { create } from 'zustand';
import apiClient, { handleApiError } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('library_token'),
  isAuthenticated: !!localStorage.getItem('library_token'),
  loading: false,
  error: null,

  init: () => {
    const storedUser = localStorage.getItem('library_user');
    if (storedUser) {
      set({ user: JSON.parse(storedUser), isAuthenticated: true });
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('library_token', token);
      localStorage.setItem('library_user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false
      });
      
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  register: async (username, password, email) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', { username, password, email });
      const { token, user } = response.data.data;
      
      localStorage.setItem('library_token', token);
      localStorage.setItem('library_user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false
      });
      
      return { success: true };
    } catch (error) {
      const message = handleApiError(error);
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },

  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
    localStorage.setItem('library_user', JSON.stringify({ ...get().user, ...userData }));
  }
}));

export default useAuthStore;

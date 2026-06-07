import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  token: localStorage.getItem('token'),
  isLoading: true,

  setToken: (token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, profile: null, token: null });
  },

  fetchCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await axios.get('/api/auth/me');
      set({ user: data.user, profile: data.profile, token, isLoading: false });
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, profile: null, token: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    set({ user: data.user, profile: data.profile, token: data.token });
    return data;
  },

  register: async (userData) => {
    const { data } = await axios.post('/api/auth/register', userData);
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    set({ user: data.user, token: data.token });
    return data;
  }
}));

export default useAuthStore;

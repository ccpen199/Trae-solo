import { create } from 'zustand';
import api from '../utils/api';

const useStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  cartCount: 0,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  login: async (credentials, type = 'phone') => {
    try {
      const endpoint = type === 'phone' ? '/auth/phone-login' : '/auth/wechat-login';
      const response = await api.post(endpoint, credentials);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      set({ user: response.user, isAuthenticated: true });
      get().fetchCartCount();
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, cartCount: 0 });
  },
  
  restoreAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
        get().fetchCartCount();
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  },
  
  fetchCartCount: async () => {
    try {
      if (!get().isAuthenticated) return;
      const response = await api.get('/cart/count');
      set({ cartCount: response.count });
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  },
  
  updateCartCount: (count) => set({ cartCount: count }),
  
  addToCart: async (productId, skuId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', { product_id: productId, sku_id: skuId, quantity });
      set({ cartCount: response.cart_count });
      return response;
    } catch (error) {
      throw error;
    }
  }
}));

export default useStore;

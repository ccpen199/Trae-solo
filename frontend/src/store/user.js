import { defineStore } from 'pinia';
import { authApi } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    profile: null,
    stats: null,
    token: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role || '',
    isPassenger: (state) => state.user?.role === 'passenger',
    isDriver: (state) => state.user?.role === 'driver',
    isAdmin: (state) => state.user?.role === 'admin',
    isDispatcher: (state) => state.user?.role === 'dispatcher',
    isCustomerService: (state) => state.user?.role === 'customer_service',
    isRiskControl: (state) => state.user?.role === 'risk_control',
    todoCount: (state) => state.stats?.todoCount || 0,
    unreadCount: (state) => state.stats?.unreadCount || 0
  },

  actions: {
    async login(username, password) {
      const result = await authApi.login(username, password);
      
      if (result.success) {
        this.user = result.user;
        this.profile = result.profile;
        this.stats = result.stats;
        this.persist();
      }
      
      return result;
    },

    logout() {
      this.user = null;
      this.profile = null;
      this.stats = null;
      this.token = null;
      localStorage.removeItem('rideHailingUser');
    },

    persist() {
      const data = {
        user: this.user,
        profile: this.profile,
        stats: this.stats
      };
      localStorage.setItem('rideHailingUser', JSON.stringify(data));
    },

    restore() {
      const saved = localStorage.getItem('rideHailingUser');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.user = data.user;
          this.profile = data.profile;
          this.stats = data.stats;
        } catch (e) {
          console.error('Failed to restore user state:', e);
        }
      }
    },

    updateStats(stats) {
      if (this.stats) {
        this.stats = { ...this.stats, ...stats };
        this.persist();
      }
    }
  }
});

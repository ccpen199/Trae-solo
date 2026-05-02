import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          token,
          user,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          token: null,
          user: null,
          isAuthenticated: false
        });
      },
      
      updateUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },
      
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.role === role;
      },
      
      getRoleName: () => {
        const user = get().user;
        if (!user) return '';
        return user.roleName || user.role;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  orderDetail: null,
  todoCounts: {},
  statistics: null,
  statuses: [],
  
  setOrders: (orders) => set({ orders }),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setOrderDetail: (detail) => set({ orderDetail: detail }),
  
  setTodoCounts: (counts) => set({ todoCounts: counts }),
  
  setStatistics: (stats) => set({ statistics: stats }),
  
  setStatuses: (statuses) => set({ statuses }),
  
  updateOrderStatus: (orderId, newStatus, newStatusName) => {
    set((state) => ({
      orders: state.orders.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus, statusName: newStatusName } 
          : o
      ),
      currentOrder: state.currentOrder?.id === orderId 
        ? { ...state.currentOrder, status: newStatus, statusName: newStatusName }
        : state.currentOrder,
      orderDetail: state.orderDetail?.order?.id === orderId
        ? { ...state.orderDetail, order: { ...state.orderDetail.order, status: newStatus, statusName: newStatusName } }
        : state.orderDetail
    }));
  },
  
  addLayer: (layer) => {
    set((state) => ({
      orderDetail: state.orderDetail 
        ? { ...state.orderDetail, layers: [...(state.orderDetail.layers || []), layer] }
        : state.orderDetail
    }));
  },
  
  updateLayer: (layerId, updates) => {
    set((state) => ({
      orderDetail: state.orderDetail
        ? {
            ...state.orderDetail,
            layers: state.orderDetail.layers?.map(l =>
              l.id === layerId ? { ...l, ...updates } : l
            ) || []
          }
        : state.orderDetail
    }));
  }
}));

const useTemplateStore = create((set) => ({
  templates: [],
  categories: [],
  currentTemplate: null,
  
  setTemplates: (templates) => set({ templates }),
  
  setCategories: (categories) => set({ categories }),
  
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  
  updateTemplateLock: (templateId, isLocked, lockedBy) => {
    set((state) => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? { ...t, is_locked: isLocked ? 1 : 0, locked_by: lockedBy }
          : t
      ),
      currentTemplate: state.currentTemplate?.id === templateId
        ? { ...state.currentTemplate, is_locked: isLocked ? 1 : 0, locked_by: lockedBy }
        : state.currentTemplate
    }));
  }
}));

const useUIStore = create((set) => ({
  loading: false,
  sidebarCollapsed: false,
  currentRoute: '/',
  notification: null,
  
  setLoading: (loading) => set({ loading }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setCurrentRoute: (route) => set({ currentRoute: route }),
  
  showNotification: (type, message, description) => {
    set({ notification: { type, message, description } });
    setTimeout(() => set({ notification: null }), 5000);
  },
  
  clearNotification: () => set({ notification: null })
}));

export { useAuthStore, useOrderStore, useTemplateStore, useUIStore };

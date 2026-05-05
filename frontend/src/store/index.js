import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      onboardingStatus: null,
      
      setAuth: (token, user, onboardingStatus) => set({ token, user, onboardingStatus }),
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      updateOnboarding: (status) => set((state) => ({
        onboardingStatus: { ...state.onboardingStatus, ...status }
      })),
      logout: () => set({ token: null, user: null, onboardingStatus: null }),
      
      isAuthenticated: () => !!get().token,
      canRide: () => get().onboardingStatus?.canRide,
    }),
    {
      name: 'bike-auth-storage',
    }
  )
);

export const useBikeStore = create((set, get) => ({
  nearbyBikes: [],
  parkingZones: [],
  selectedBike: null,
  nearestBike: null,
  loading: false,
  
  setNearbyBikes: (bikes, zones) => {
    const bikeList = bikes || [];
    const nearest = bikeList.find(b => b.isNearest) || bikeList[0] || null;
    set({ 
      nearbyBikes: bikeList,
      parkingZones: zones || [],
      nearestBike: nearest
    });
  },
  
  selectBike: (bike) => set({ selectedBike: bike }),
  clearSelectedBike: () => set({ selectedBike: null }),
  
  setLoading: (loading) => set({ loading }),
}));

export const useOrderStore = create(
  persist(
    (set, get) => ({
      activeOrder: null,
      startTime: null,
      
      setActiveOrder: (order) => {
        if (order) {
          set({ 
            activeOrder: order, 
            startTime: order.startTime || new Date().toISOString() 
          });
        } else {
          set({ activeOrder: null, startTime: null });
        }
      },
      
      updateOrder: (updates) => set((state) => ({
        activeOrder: state.activeOrder ? { ...state.activeOrder, ...updates } : null
      })),
      
      clearOrder: () => set({ activeOrder: null, startTime: null }),
      
      hasActiveOrder: () => !!get().activeOrder,
    }),
    {
      name: 'bike-order-storage',
      partialize: (state) => ({
        activeOrder: state.activeOrder,
        startTime: state.startTime
      }),
    }
  )
);

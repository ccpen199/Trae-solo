import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      
      setAuth: (token, user) => set({
        token,
        user,
        isLoggedIn: true
      }),
      
      setUser: (user) => set({ user }),
      
      logout: () => set({
        token: null,
        user: null,
        isLoggedIn: false
      })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isLoggedIn: state.isLoggedIn })
    }
  )
);

export const useOrderStore = create((set, get) => ({
  currentOrder: null,
  selectedCarType: null,
  routeInfo: null,
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setSelectedCarType: (carType) => set({ selectedCarType: carType }),
  
  setRouteInfo: (info) => set({ routeInfo: info }),
  
  clearOrder: () => set({
    currentOrder: null,
    selectedCarType: null,
    routeInfo: null
  })
}));

export const useLocationStore = create((set, get) => ({
  currentCity: null,
  currentLocation: null,
  startPoint: null,
  endPoint: null,
  
  setCurrentCity: (city) => set({ currentCity: city }),
  
  setCurrentLocation: (location) => set({ currentLocation: location }),
  
  setStartPoint: (point) => set({ startPoint: point }),
  
  setEndPoint: (point) => set({ endPoint: point }),
  
  clearRoute: () => set({ startPoint: null, endPoint: null })
}));
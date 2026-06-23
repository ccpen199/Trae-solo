import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { City, GarbageCategory, AdminLoginResponse } from '../../shared/types';

interface AppState {
  currentCity: City | null;
  cities: City[];
  categories: GarbageCategory[];
  admin: AdminLoginResponse['admin'] | null;
  token: string | null;
  isLoading: boolean;
  setCurrentCity: (city: City) => void;
  setCities: (cities: City[]) => void;
  setCategories: (categories: GarbageCategory[]) => void;
  setAdmin: (admin: AdminLoginResponse['admin'] | null, token?: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentCity: null,
      cities: [],
      categories: [],
      admin: null,
      token: null,
      isLoading: false,
      
      setCurrentCity: (city) => set({ currentCity: city }),
      setCities: (cities) => set({ cities }),
      setCategories: (categories) => set({ categories }),
      setAdmin: (admin, token) => {
        if (admin && token) {
          localStorage.setItem('admin_token', token);
          localStorage.setItem('admin_info', JSON.stringify(admin));
        }
        set({ admin, token: token || null });
      },
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        set({ admin: null, token: null });
      }
    }),
    {
      name: 'garbage-app-storage',
      partialize: (state) => ({
        currentCity: state.currentCity,
        cities: state.cities,
        admin: state.admin,
        token: state.token
      })
    }
  )
);

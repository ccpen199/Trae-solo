import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  doctorId?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

interface AppState {
  selectedPackage: any;
  selectedDate: string;
  selectedTimeSlot: string;
  currentReservation: any;
  setSelectedPackage: (pkg: any) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTimeSlot: (slot: string) => void;
  setCurrentReservation: (reservation: any) => void;
  clearSelection: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true,
      }),
      clearAuth: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
      }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'medical-exam-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useAppStore = create<AppState>()(
  (set) => ({
    selectedPackage: null,
    selectedDate: '',
    selectedTimeSlot: '',
    currentReservation: null,
    setSelectedPackage: (pkg) => set({ selectedPackage: pkg }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
    setCurrentReservation: (reservation) => set({ currentReservation: reservation }),
    clearSelection: () => set({
      selectedPackage: null,
      selectedDate: '',
      selectedTimeSlot: '',
    }),
  })
);

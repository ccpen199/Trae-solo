import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, City, DateSelection } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => {
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface SearchState {
  selectedCity: City | null;
  keyword: string;
  dateSelection: DateSelection;
  guests: number;
  setSelectedCity: (city: City | null) => void;
  setKeyword: (keyword: string) => void;
  setDateSelection: (selection: Partial<DateSelection>) => void;
  setGuests: (guests: number) => void;
  clearSearch: () => void;
}

const defaultDateSelection: DateSelection = {
  checkIn: null,
  checkOut: null,
  nights: 0,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      selectedCity: null,
      keyword: '',
      dateSelection: defaultDateSelection,
      guests: 2,
      setSelectedCity: (city) => set({ selectedCity: city }),
      setKeyword: (keyword) => set({ keyword }),
      setDateSelection: (selection) =>
        set((state) => ({
          dateSelection: { ...state.dateSelection, ...selection },
        })),
      setGuests: (guests) => set({ guests }),
      clearSearch: () => set({
        selectedCity: null,
        keyword: '',
        dateSelection: defaultDateSelection,
        guests: 2,
      }),
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({
        selectedCity: state.selectedCity,
        keyword: state.keyword,
        dateSelection: {
          ...state.dateSelection,
          checkIn: state.dateSelection.checkIn ? state.dateSelection.checkIn.toISOString() : null,
          checkOut: state.dateSelection.checkOut ? state.dateSelection.checkOut.toISOString() : null,
        },
        guests: state.guests,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.dateSelection) {
          if (typeof state.dateSelection.checkIn === 'string') {
            state.dateSelection.checkIn = new Date(state.dateSelection.checkIn);
          }
          if (typeof state.dateSelection.checkOut === 'string') {
            state.dateSelection.checkOut = new Date(state.dateSelection.checkOut);
          }
        }
      },
    }
  )
);

interface ModalState {
  showLoginModal: boolean;
  showDatePicker: boolean;
  showCityPicker: boolean;
  redirectAfterLogin: string | null;
  setShowLoginModal: (show: boolean, redirect?: string | null) => void;
  setShowDatePicker: (show: boolean) => void;
  setShowCityPicker: (show: boolean) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  showLoginModal: false,
  showDatePicker: false,
  showCityPicker: false,
  redirectAfterLogin: null,
  setShowLoginModal: (show, redirect = null) =>
    set({ showLoginModal: show, redirectAfterLogin: redirect }),
  setShowDatePicker: (show) => set({ showDatePicker: show }),
  setShowCityPicker: (show) => set({ showCityPicker: show }),
}));

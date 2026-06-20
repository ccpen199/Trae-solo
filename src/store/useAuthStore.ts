import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ArtistProfile } from '@shared/types';
import { mockCurrentUser, mockCurrentArtistProfile } from '../data/mockData';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  artistProfile: ArtistProfile | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  setArtistProfile: (profile: ArtistProfile | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      artistProfile: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (email && password) {
            set({
              user: mockCurrentUser,
              token: 'mock-jwt-token-' + Date.now(),
              isAuthenticated: true,
              isLoading: false,
              artistProfile: mockCurrentArtistProfile,
            });
            return true;
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          artistProfile: null,
        });
        localStorage.removeItem('auth-storage');
      },

      register: async (userData: Partial<User> & { password: string }) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const newUser: User = {
            id: 'user-' + Date.now(),
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role || 'artist',
            isVerified: false,
            createdAt: new Date(),
          };
          
          set({
            user: newUser,
            token: 'mock-jwt-token-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token) {
              set({
                isLoading: false,
                isAuthenticated: true,
                user: parsed.state.user,
                token: parsed.state.token,
                artistProfile: mockCurrentArtistProfile,
              });
              return true;
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      setArtistProfile: (profile: ArtistProfile | null) => {
        set({ artistProfile: profile });
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

export default useAuthStore;

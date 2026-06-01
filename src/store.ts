import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  idCard: string;
  faceVerified: boolean;
  bankCardVerified: boolean;
}

interface Officer {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  officer: Officer | null;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  setOfficer: (officer: Officer | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      officer: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setOfficer: (officer) => set({ officer }),
      logout: () => set({ token: null, user: null, officer: null }),
    }),
    {
      name: 'tax-auth-storage',
    }
  )
);

interface DeclarationState {
  currentDeclaration: any | null;
  setCurrentDeclaration: (declaration: any | null) => void;
}

export const useDeclarationStore = create<DeclarationState>((set) => ({
  currentDeclaration: null,
  setCurrentDeclaration: (declaration) => set({ currentDeclaration: declaration }),
}));

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: string;
  name: string | null;
  avatar_url: string | null;
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  profile: any | null;
  skills: any[];
  certificates: any[];
  isAuthenticated: boolean;
  login: (token: string, user: User, profile?: any) => void;
  logout: () => void;
  setProfile: (profile: any, skills?: any[], certificates?: any[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  profile: null,
  skills: [],
  certificates: [],
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, user, profile) => {
    localStorage.setItem('token', token);
    set({ token, user, profile, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, profile: null, skills: [], certificates: [], isAuthenticated: false });
  },
  setProfile: (profile, skills = [], certificates = []) => {
    set({ profile, skills, certificates });
  },
}));

import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'company' | 'school' | 'government';
  related_id: string;
  admin_division_id: string;
}

interface AppState {
  currentLevel: 'province' | 'city' | 'county';
  currentDivision: any;
  user: User | null;
  setCurrentLevel: (level: 'province' | 'city' | 'county') => void;
  setCurrentDivision: (division: any) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentLevel: 'province',
  currentDivision: null,
  user: null,
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setCurrentDivision: (division) => set({ currentDivision: division }),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

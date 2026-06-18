
import { create } from 'zustand';

interface UserState {
  isLoggedIn: boolean;
  user: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  } | null;
  login: (user: UserState['user']) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: true,
  user: {
    id: 'u-001',
    name: '监管专员',
    role: 'regulator',
    avatar: '',
    verified: true,
  },
  login: (user) => set({ isLoggedIn: true, user }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));

interface TraceState {
  currentCode: string;
  setCurrentCode: (code: string) => void;
}

export const useTraceStore = create<TraceState>((set) => ({
  currentCode: 'TRC-2026-RICE-89138',
  setCurrentCode: (code) => set({ currentCode: code }),
}));

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 12,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));

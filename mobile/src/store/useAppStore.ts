import { create } from 'zustand';
import type { User, CACertificate, TodoItem } from '@/types';

interface AppState {
  user: User | null;
  certificate: CACertificate | null;
  todos: TodoItem[];
  unreadCount: number;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setCertificate: (cert: CACertificate) => void;
  markTodoRead: (id: string) => void;
  refreshUnreadCount: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  certificate: null,
  todos: [],
  unreadCount: 0,
  isLoggedIn: false,
  login: (user) => {
    console.log('[Auth] 用户登录:', user.name, '认证级别:', user.authLevel);
    set({ user, isLoggedIn: true });
  },
  logout: () => {
    console.log('[Auth] 用户登出');
    set({ user: null, certificate: null, todos: [], unreadCount: 0, isLoggedIn: false });
  },
  setCertificate: (cert) => {
    console.log('[Cert] CA证书更新:', cert.certSn, '状态:', cert.status);
    set({ certificate: cert });
  },
  markTodoRead: (id) => {
    const todos = get().todos.map(t => t.id === id ? { ...t, isRead: true } : t);
    const unreadCount = todos.filter(t => !t.isRead).length;
    set({ todos, unreadCount });
  },
  refreshUnreadCount: () => {
    const unreadCount = get().todos.filter(t => !t.isRead).length;
    set({ unreadCount });
  }
}));

import { create } from 'zustand';

export type UserRole = 'worker' | 'broker' | 'factory' | 'admin';

interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'bluelink_auth';

function loadFromStorage(): { user: AuthUser | null; token: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { user: parsed.user || null, token: parsed.token || null };
    }
  } catch {}
  return { user: null, token: null };
}

function saveToStorage(user: AuthUser | null, token: string | null) {
  if (user && token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const stored = loadFromStorage();
  return {
    user: stored.user,
    token: stored.token,
    login: (user, token) => {
      saveToStorage(user, token);
      set({ user, token });
    },
    logout: () => {
      saveToStorage(null, null);
      set({ user: null, token: null });
    },
  };
});

export const MOCK_USERS: AuthUser[] = [
  { id: 'w-001', role: 'worker', name: '张伟', phone: '138****2341', avatar: '👨' },
  { id: 'b-001', role: 'broker', name: '王建国', phone: '139****5566', avatar: '🧑‍💼' },
  { id: 'f-001', role: 'factory', name: '苏州立讯精密', phone: '0512-6288XXXX', avatar: '🎧' },
  { id: 'admin-001', role: 'admin', name: '系统管理员', phone: 'admin@platform', avatar: '🛡️' },
];

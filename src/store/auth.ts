import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  department?: string;
  enterprise_id?: number | null;
  enterprise?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  lastError: string | null;
  _isInitialized: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User | null }>;
  logout: () => void;
  initializeFromStorage: () => void;
}

const STORAGE_KEY = 'auth-storage-manual';

function saveToStorage(state: Partial<AuthState>) {
  try {
    const data = {
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[Auth] 已保存到 localStorage:', data);
    return true;
  } catch (e) {
    console.error('[Auth] 保存到 localStorage 失败:', e);
    return false;
  }
}

function loadFromStorage(): { user: User | null; token: string | null; isAuthenticated: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[Auth] localStorage 中无数据');
      return null;
    }
    const data = JSON.parse(raw);
    console.log('[Auth] 从 localStorage 读取:', data);
    return data;
  } catch (e) {
    console.error('[Auth] 从 localStorage 读取失败:', e);
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Auth] 已清除 localStorage');
  } catch (e) {
    console.error('[Auth] 清除 localStorage 失败:', e);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  lastError: null,
  _isInitialized: false,

  initializeFromStorage: () => {
    console.log('[Auth] 开始从 localStorage 初始化...');
    const stored = loadFromStorage();
    if (stored && stored.isAuthenticated && stored.user) {
      set({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
        _isInitialized: true,
      });
      console.log('[Auth] 初始化完成, 用户:', stored.user.name, '角色:', stored.user.role);
    } else {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        _isInitialized: true,
      });
      console.log('[Auth] 初始化完成, 未登录');
    }
  },

  login: async (username: string, password: string) => {
    console.log('[Login] 开始登录流程, 账号:', username);
    
    try {
      console.log('[Login] 发送请求到 /api/auth/login');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      console.log('[Login] 响应状态码:', response.status);
      const data = await response.json();
      console.log('[Login] 响应数据:', data);
      
      if (data.success) {
        const userData = data.data;
        console.log('[Login] 登录成功, 用户:', userData.name, '角色:', userData.role);
        
        const newState = {
          user: userData,
          token: userData.token,
          isAuthenticated: true,
          lastError: null,
        };
        
        set(newState);
        
        console.log('[Login] 状态已更新, 保存到 localStorage...');
        const saved = saveToStorage(newState);
        
        if (!saved) {
          console.error('[Login] 无法保存到 localStorage, 登录失败');
          return { success: false, error: '本地存储异常，请检查浏览器设置', user: null };
        }
        
        const verify = loadFromStorage();
        if (!verify || !verify.isAuthenticated) {
          console.error('[Login] localStorage 验证失败');
          return { success: false, error: '本地存储验证失败，请重试', user: null };
        }
        
        console.log('[Login] localStorage 验证成功');
        return { success: true, user: userData };
      } else {
        console.log('[Login] 登录失败:', data.error);
        set({ lastError: data.error });
        return { success: false, error: data.error, user: null };
      }
    } catch (error: any) {
      console.error('[Login] 异常:', error);
      const errorMsg = error.message || '网络连接失败，请检查网络';
      set({ lastError: errorMsg });
      return { success: false, error: errorMsg, user: null };
    }
  },

  logout: () => {
    console.log('[Logout] 退出登录');
    clearStorage();
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      lastError: null,
      _isInitialized: true,
    });
  },
}));

console.log('[Auth] Store 已创建');

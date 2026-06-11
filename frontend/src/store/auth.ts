import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { AuthState, LoginParams, RealNameAuthParams, FaceAuthParams } from '@/types/user';

interface AuthStore extends AuthState {
  loading: boolean;
  login: (params: LoginParams) => Promise<boolean>;
  logout: () => void;
  realNameAuth: (params: RealNameAuthParams) => Promise<boolean>;
  faceAuth: (params: FaceAuthParams) => Promise<boolean>;
  checkAuth: () => boolean;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isLoggedIn: false,
  token: '',
  userInfo: null,
  loginTime: '',
  expireTime: '',
  loading: false,

  login: async (params) => {
    set({ loading: true });
    console.log('[AuthStore] 开始登录', params.phone || params.idCard);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const mockUserInfo = {
        id: `user_${Date.now()}`,
        name: '张三',
        idCard: '320101199001011234',
        phone: params.phone || '13800138000',
        avatar: 'https://picsum.photos/id/64/200/200',
        gender: 'male' as const,
        birthDate: '1990-01-01',
        address: '江苏省南京市鼓楼区XX街道XX号',
        realNameVerified: true,
        faceVerified: true,
        ecardActivated: true
      };
      
      const now = new Date();
      const expire = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      set({
        isLoggedIn: true,
        token: mockToken,
        userInfo: mockUserInfo,
        loginTime: now.toISOString(),
        expireTime: expire.toISOString(),
        loading: false
      });
      
      try {
        Taro.setStorageSync('token', mockToken);
        Taro.setStorageSync('userInfo', mockUserInfo);
      } catch (e) {
        console.error('[AuthStore] 存储登录信息失败', e);
      }
      
      console.log('[AuthStore] 登录成功');
      return true;
    } catch (error) {
      console.error('[AuthStore] 登录失败', error);
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    console.log('[AuthStore] 退出登录');
    set({
      isLoggedIn: false,
      token: '',
      userInfo: null,
      loginTime: '',
      expireTime: ''
    });
    try {
      Taro.removeStorageSync('token');
      Taro.removeStorageSync('userInfo');
    } catch (e) {
      console.error('[AuthStore] 清除登录信息失败', e);
    }
  },

  realNameAuth: async (params) => {
    set({ loading: true });
    console.log('[AuthStore] 开始实名认证', params.name);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { userInfo } = get();
      if (userInfo) {
        set({
          userInfo: {
            ...userInfo,
            realNameVerified: true,
            name: params.name,
            idCard: params.idCard
          },
          loading: false
        });
        
        try {
          Taro.setStorageSync('userInfo', {
            ...userInfo,
            realNameVerified: true,
            name: params.name,
            idCard: params.idCard
          });
        } catch (e) {
          console.error('[AuthStore] 存储实名认证信息失败', e);
        }
      }
      
      console.log('[AuthStore] 实名认证成功');
      return true;
    } catch (error) {
      console.error('[AuthStore] 实名认证失败', error);
      set({ loading: false });
      return false;
    }
  },

  faceAuth: async (params) => {
    set({ loading: true });
    console.log('[AuthStore] 开始人脸核验');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { userInfo } = get();
      if (userInfo) {
        set({
          userInfo: {
            ...userInfo,
            faceVerified: true
          },
          loading: false
        });
        
        try {
          Taro.setStorageSync('userInfo', {
            ...userInfo,
            faceVerified: true
          });
        } catch (e) {
          console.error('[AuthStore] 存储人脸核验信息失败', e);
        }
      }
      
      console.log('[AuthStore] 人脸核验成功');
      return true;
    } catch (error) {
      console.error('[AuthStore] 人脸核验失败', error);
      set({ loading: false });
      return false;
    }
  },

  checkAuth: () => {
    const { isLoggedIn, token, expireTime } = get();
    
    if (!isLoggedIn || !token) {
      return false;
    }
    
    if (expireTime) {
      const now = new Date();
      const expire = new Date(expireTime);
      if (now > expire) {
        console.log('[AuthStore] 登录已过期');
        get().logout();
        return false;
      }
    }
    
    return true;
  },

  loadFromStorage: () => {
    try {
      const token = Taro.getStorageSync('token');
      const userInfo = Taro.getStorageSync('userInfo');
      
      if (token && userInfo) {
        set({
          isLoggedIn: true,
          token,
          userInfo,
          loginTime: Taro.getStorageSync('loginTime') || ''
        });
        console.log('[AuthStore] 从本地存储加载登录状态');
      }
    } catch (e) {
      console.error('[AuthStore] 加载本地存储失败', e);
    }
  }
}));

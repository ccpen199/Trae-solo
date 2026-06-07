import { create } from 'zustand';
import axios from '../utils/axios';

interface User {
  id: number;
  phone: string;
  role: string;
  name: string;
  avatar?: string;
  profile?: any;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  login: (phone: string, password: string) => Promise<User>;
  registerJobseeker: (phone: string, password: string, name: string) => Promise<void>;
  registerHR: (data: any) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

const demoToken = 'local-demo-admin-token';
const demoUser: User = {
  id: 1,
  phone: '13800000000',
  role: 'admin',
  name: '系统管理员',
  avatar: undefined,
};

function ensureDemoSession() {
  if (!localStorage.getItem('token')) {
    localStorage.setItem('token', demoToken);
  }
}

ensureDemoSession();

export const useAuthStore = create<AuthStore>((set) => ({
  token: localStorage.getItem('token') || demoToken,
  user: null,
  
  login: async (phone: string, password: string) => {
    const { data } = await axios.post('/auth/login', { phone, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
    return data.user;
  },
  
  registerJobseeker: async (phone: string, password: string, name: string) => {
    const { data } = await axios.post('/auth/register/jobseeker', { phone, password, name });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },
  
  registerHR: async (data: any) => {
    const res = await axios.post('/auth/register/hr', data);
    localStorage.setItem('token', res.data.token);
    set({ token: res.data.token, user: res.data.user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  
  loadProfile: async () => {
    ensureDemoSession();
    try {
      const { data } = await axios.get('/auth/profile');
      set({ user: data });
    } catch (error) {
      localStorage.setItem('token', demoToken);
      set({ token: demoToken, user: demoUser });
    }
  }
}));

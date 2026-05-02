import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null })
    }),
    {
      name: 'bike-sharing-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      })
    }
  )
);

export const roleNames: Record<string, string> = {
  rider: '骑行用户',
  maintainer: '运维员',
  dispatcher: '调度员',
  service: '客服',
  admin: '管理员'
};

export const statusNames: Record<string, string> = {
  pending_scan: '待扫码开锁',
  pending_ride: '待骑行',
  riding: '骑行中',
  pending_billing: '待关锁计费',
  billing_confirmed: '待支付',
  pending_exception: '待异常处理',
  pending_dispatch: '待调度维修',
  completed: '已完成',
  cancelled: '已取消'
};

export const exceptionTypeNames: Record<string, string> = {
  location_drift: '定位漂移',
  route_deviation: '路线偏离',
  lock_failed: '关锁失败',
  unlock_failed: '开锁失败',
  battery_low: '电量不足',
  bike_damage: '车辆损坏',
  other: '其他'
};

export const dispatchTypeNames: Record<string, string> = {
  repair: '维修',
  relocation: '移车',
  battery_swap: '换电',
  inspection: '巡检',
  cleanup: '清理'
};

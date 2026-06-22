import { get, post, put } from './http';
import type {
  Rider,
  RiderPreference,
  RiderPreferenceRequest,
  RiderStats,
  CreditHistory,
  OnlineStatusRequest,
} from '@shared/types';

const isDemoMode = (): boolean => {
  try {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state?.token?.startsWith?.('demo-token-')) return true;
    }
  } catch {}
  return false;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEMO_RIDER_ID = 'rider-demo-001';

const now = Date.now();

const defaultPreference: RiderPreference = {
  id: 'pref-demo-001',
  riderId: DEMO_RIDER_ID,
  maxDistance: 5000,
  minAmount: 10,
  orderTypes: ['express', 'takeout', 'grocery', 'medicine', 'document'],
  workingHours: [
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '20:00' },
  ],
  acceptAutoDispatch: true,
  autoAccept: false,
  minOrderAmount: 10,
  preferredAreas: ['朝阳区', '海淀区'],
  avoidAreas: [],
  vehicleType: 'electric_bike',
  createdAt: new Date(now - 86400000 * 30),
  updatedAt: new Date(now - 86400000),
};

const demoStats: RiderStats = {
  totalOrders: 1256,
  totalEarnings: 28650,
  completionRate: 96.5,
  timeoutOrders: 23,
  cancelledOrders: 18,
  averageDeliveryTime: 28,
};

const demoCreditHistory: CreditHistory[] = [
  {
    id: 'credit-1',
    riderId: DEMO_RIDER_ID,
    change: 5,
    reason: '按时完成订单',
    description: '订单 DD202606200001 按时送达',
    orderId: 'order-demo-001',
    createdAt: new Date(now - 86400000),
    updatedAt: new Date(now - 86400000),
  },
  {
    id: 'credit-2',
    riderId: DEMO_RIDER_ID,
    change: -3,
    reason: '订单超时',
    description: '订单 DD202606190002 超时5分钟',
    orderId: 'order-demo-002',
    createdAt: new Date(now - 86400000 * 2),
    updatedAt: new Date(now - 86400000 * 2),
  },
  {
    id: 'credit-3',
    riderId: DEMO_RIDER_ID,
    change: 10,
    reason: '优质服务好评',
    description: '获得用户5星好评，额外奖励',
    orderId: 'order-demo-003',
    createdAt: new Date(now - 86400000 * 3),
    updatedAt: new Date(now - 86400000 * 3),
  },
  {
    id: 'credit-4',
    riderId: DEMO_RIDER_ID,
    change: 2,
    reason: '按时完成订单',
    description: '订单 DD202606170004 按时送达',
    orderId: 'order-demo-004',
    createdAt: new Date(now - 86400000 * 4),
    updatedAt: new Date(now - 86400000 * 4),
  },
  {
    id: 'credit-5',
    riderId: DEMO_RIDER_ID,
    change: -5,
    reason: '用户投诉',
    description: '因服务态度问题被用户投诉',
    orderId: 'order-demo-005',
    createdAt: new Date(now - 86400000 * 7),
    updatedAt: new Date(now - 86400000 * 7),
  },
];

const getDemoRider = (): Rider => {
  try {
    const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    if (storage.state?.user) return storage.state.user;
  } catch {}
  return {
    id: DEMO_RIDER_ID,
    phone: '13900000001',
    name: '演示骑手',
    avatar: '',
    vehicleType: 'electric_bike',
    realNameVerified: true,
    realNameAuditStatus: 'approved',
    qualificationVerified: true,
    qualificationAuditStatus: 'approved',
    auditStatus: 'approved',
    creditScore: 92,
    isFrozen: false,
    onlineStatus: 'online',
    isOnline: true,
    completedOrders: 1256,
    totalDistance: 5800000,
    totalEarnings: 28650,
    role: 'rider',
    createdAt: new Date(now - 86400000 * 180),
    updatedAt: new Date(now - 3600000),
  };
};

export const riderService = {
  getPreferences: async () => {
    try {
      return await get<RiderPreference>('/rider/preference');
    } catch {
      if (isDemoMode()) {
        await delay(250);
        return defaultPreference;
      }
      throw new Error('获取偏好设置失败');
    }
  },

  updatePreferences: async (data: RiderPreferenceRequest) => {
    try {
      return await put<RiderPreference>('/rider/preference', data);
    } catch {
      if (isDemoMode()) {
        await delay(300);
        const updated = { ...defaultPreference, ...data, updatedAt: new Date() };
        return updated;
      }
      throw new Error('更新偏好设置失败');
    }
  },

  getStats: async () => {
    try {
      return await get<RiderStats>('/rider/statistics');
    } catch {
      if (isDemoMode()) {
        await delay(300);
        return demoStats;
      }
      throw new Error('获取统计数据失败');
    }
  },

  getCreditHistory: async (page = 1, pageSize = 20) => {
    try {
      return await get<{ items: CreditHistory[]; total: number }>(
        `/rider/credit-history?page=${page}&pageSize=${pageSize}`
      );
    } catch {
      if (isDemoMode()) {
        await delay(250);
        const start = (page - 1) * pageSize;
        const items = demoCreditHistory.slice(start, start + pageSize);
        return { items, total: demoCreditHistory.length };
      }
      throw new Error('获取信用分记录失败');
    }
  },

  updateOnlineStatus: async (data: OnlineStatusRequest) => {
    try {
      return await post<Rider>('/rider/online-status', { isOnline: data.online });
    } catch {
      if (isDemoMode()) {
        await delay(200);
        const rider = getDemoRider();
        const updatedRider = {
          ...rider,
          isOnline: data.online,
          onlineStatus: (data.online ? 'online' : 'offline') as 'online' | 'offline',
          updatedAt: new Date(),
        };
        try {
          const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          storage.state = storage.state || {};
          storage.state.user = updatedRider;
          localStorage.setItem('auth-storage', JSON.stringify(storage));
        } catch {}
        return updatedRider;
      }
      throw new Error('更新在线状态失败');
    }
  },
};

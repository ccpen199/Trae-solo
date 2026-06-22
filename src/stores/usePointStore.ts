import { create } from 'zustand';
import type { PointRecord, PointTask, MallItem, User } from '../types';
import { mockPointRecords, mockPointTasks, mockMallItems } from '../data/mockPoints';
import { mockUsers } from '../data/mockUsers';
import { getStorage, setStorage } from '../utils/storage';

interface PointStoreState {
  pointRecords: PointRecord[];
  tasks: PointTask[];
  mallItems: MallItem[];
  loading: boolean;
}

interface PointStoreActions {
  fetchPointRecords: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchMallItems: () => Promise<void>;
  completeTask: (taskId: string) => Promise<{ success: boolean; points: number }>;
  exchangeItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
  donatePoints: (amount: number, projectId: string) => Promise<{ success: boolean; certificate?: string }>;
}

type PointStore = PointStoreState & PointStoreActions;

const getCurrentUser = (): User => {
  const stored = getStorage<{ user: User | null }>('user_store', { user: null });
  return stored.user || mockUsers[0];
};

const updateUserPoints = (delta: number): User => {
  const stored = getStorage<{ user: User | null; token: string | null }>('user_store', { user: null, token: null });
  if (stored.user) {
    const updatedUser = {
      ...stored.user,
      points: stored.user.points + delta,
    };
    setStorage('user_store', { user: updatedUser, token: stored.token });
    return updatedUser;
  }
  return mockUsers[0];
};

export const usePointStore = create<PointStore>((set, get) => ({
  pointRecords: [],
  tasks: [],
  mallItems: [],
  loading: false,

  fetchPointRecords: async (): Promise<void> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 400));

    const currentUser = getCurrentUser();
    const records = mockPointRecords.filter(r => r.userId === currentUser.id);
    set({ pointRecords: records, loading: false });
  },

  fetchTasks: async (): Promise<void> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 400));

    set({ tasks: [...mockPointTasks], loading: false });
  },

  fetchMallItems: async (): Promise<void> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 400));

    set({ mallItems: [...mockMallItems], loading: false });
  },

  completeTask: async (taskId: string): Promise<{ success: boolean; points: number }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const task = get().tasks.find(t => t.id === taskId);
    if (!task || task.completed) {
      return { success: false, points: 0 };
    }

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, completed: true, progress: t.target }
          : t
      ),
    }));

    const currentUser = updateUserPoints(task.points);

    const newRecord: PointRecord = {
      id: 'pr' + Date.now(),
      userId: currentUser.id,
      type: 'earn',
      amount: task.points,
      balance: currentUser.points,
      reason: task.name,
      source: task.source || 'login',
      createdAt: new Date(),
    };

    set(state => ({
      pointRecords: [newRecord, ...state.pointRecords],
    }));

    return { success: true, points: task.points };
  },

  exchangeItem: async (itemId: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const item = get().mallItems.find(i => i.id === itemId);
    const currentUser = getCurrentUser();

    if (!item) {
      return { success: false, message: '商品不存在' };
    }

    if (item.stock <= 0) {
      return { success: false, message: '库存不足' };
    }

    if (currentUser.points < item.price) {
      return { success: false, message: '积分不足' };
    }

    set(state => ({
      mallItems: state.mallItems.map(i =>
        i.id === itemId
          ? { ...i, stock: i.stock - 1, sold: i.sold + 1 }
          : i
      ),
    }));

    const updatedUser = updateUserPoints(-item.price);

    const newRecord: PointRecord = {
      id: 'pr' + Date.now(),
      userId: currentUser.id,
      type: 'spend',
      amount: item.price,
      balance: updatedUser.points,
      reason: `兑换${item.name}`,
      source: 'exchange',
      relatedId: itemId,
      createdAt: new Date(),
    };

    set(state => ({
      pointRecords: [newRecord, ...state.pointRecords],
    }));

    return { success: true, message: '兑换成功！请在订单中查看兑换码' };
  },

  donatePoints: async (amount: number, projectId: string): Promise<{ success: boolean; certificate?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentUser = getCurrentUser();

    if (currentUser.points < amount) {
      return { success: false };
    }

    const updatedUser = updateUserPoints(-amount);

    const newRecord: PointRecord = {
      id: 'pr' + Date.now(),
      userId: currentUser.id,
      type: 'spend',
      amount,
      balance: updatedUser.points,
      reason: `公益捐赠${amount / 10}元`,
      source: 'donate',
      relatedId: projectId,
      createdAt: new Date(),
    };

    set(state => ({
      pointRecords: [newRecord, ...state.pointRecords],
    }));

    const certificate = `CERT-${Date.now()}`;

    return { success: true, certificate };
  },
}));

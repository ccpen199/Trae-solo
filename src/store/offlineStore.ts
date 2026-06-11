import { create } from 'zustand';
import localforage from 'localforage';
import { attendanceApi, studentApi } from '@/api/endpoints';
import type { CheckInRequest } from '@shared/types';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface PendingItem {
  id: string;
  type: 'checkin' | 'create_student' | 'update_student' | 'delete_student';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface CacheStatus {
  totalCached: number;
  pendingItems: number;
  storageUsed: number;
  lastSyncTime: number | null;
}

interface OfflineState {
  pendingQueue: PendingItem[];
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  addToQueue: (type: PendingItem['type'], data: any) => Promise<void>;
  syncQueue: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStatus: () => Promise<CacheStatus>;
  saveToCache: (key: string, data: any) => Promise<void>;
  getFromCache: <T>(key: string) => Promise<T | null>;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

localforage.config({
  name: 'StudentFundingDB',
  version: 1.0,
  storeName: 'offlineCache',
});

export const useOfflineStore = create<OfflineState>((set, get) => ({
  pendingQueue: [],
  syncStatus: 'idle',
  lastSyncTime: null,

  addToQueue: async (type: PendingItem['type'], data: any) => {
    const item: PendingItem = {
      id: generateId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const pendingQueue = [...get().pendingQueue, item];
    set({ pendingQueue });

    try {
      await localforage.setItem('pendingQueue', pendingQueue);
    } catch (error) {
      console.error('保存待处理队列失败:', error);
    }
  },

  syncQueue: async () => {
    const { pendingQueue } = get();
    if (pendingQueue.length === 0) {
      set({ syncStatus: 'idle' });
      return;
    }

    set({ syncStatus: 'syncing' });
    const failedItems: PendingItem[] = [];

    for (const item of pendingQueue) {
      try {
        switch (item.type) {
          case 'checkin':
            await attendanceApi.checkIn(item.data as CheckInRequest);
            break;
          case 'create_student':
            await studentApi.create(item.data);
            break;
          case 'update_student':
            await studentApi.update(item.data.id, item.data);
            break;
          case 'delete_student':
            await studentApi.delete(item.data.id);
            break;
        }
      } catch (error) {
        console.error(`同步 ${item.type} 失败:`, error);
        item.retryCount++;
        if (item.retryCount < 3) {
          failedItems.push(item);
        }
      }
    }

    const success = failedItems.length === 0;
    set({
      pendingQueue: failedItems,
      syncStatus: success ? 'success' : 'error',
      lastSyncTime: Date.now(),
    });

    try {
      await localforage.setItem('pendingQueue', failedItems);
      if (success) {
        await localforage.setItem('lastSyncTime', Date.now());
      }
    } catch (error) {
      console.error('更新缓存失败:', error);
    }
  },

  clearCache: async () => {
    try {
      await localforage.clear();
      set({
        pendingQueue: [],
        lastSyncTime: null,
        syncStatus: 'idle',
      });
    } catch (error) {
      console.error('清除缓存失败:', error);
      throw error;
    }
  },

  getCacheStatus: async (): Promise<CacheStatus> => {
    let totalCached = 0;
    let storageUsed = 0;

    try {
      const keys = await localforage.keys();
      totalCached = keys.length;

      for (const key of keys) {
        const value = await localforage.getItem(key);
        if (value) {
          storageUsed += JSON.stringify(value).length;
        }
      }
    } catch (error) {
      console.error('获取缓存状态失败:', error);
    }

    const { pendingQueue, lastSyncTime } = get();
    return {
      totalCached,
      pendingItems: pendingQueue.length,
      storageUsed,
      lastSyncTime,
    };
  },

  saveToCache: async (key: string, data: any) => {
    try {
      await localforage.setItem(key, data);
    } catch (error) {
      console.error(`保存缓存 ${key} 失败:`, error);
      throw error;
    }
  },

  getFromCache: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await localforage.getItem<T>(key);
      return data;
    } catch (error) {
      console.error(`读取缓存 ${key} 失败:`, error);
      return null;
    }
  },
}));

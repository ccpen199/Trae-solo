import { create } from 'zustand';
import type { OfflineSyncRecord } from '@shared/types';

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingSync: PendingRequest[];
  syncInProgress: boolean;
  lastSyncTime: number | null;
  offlineOrders: OfflineSyncRecord[];

  setOnline: (online: boolean) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  addPendingRequest: (request: Omit<PendingRequest, 'id' | 'timestamp' | 'retryCount'>) => void;
  removePendingRequest: (id: string) => void;
  addOfflineOrder: (record: OfflineSyncRecord) => void;
  removeOfflineOrder: (recordId: string) => void;
  startSync: () => Promise<void>;
  updatePendingRequest: (id: string, data: Partial<PendingRequest>) => void;
  clearAll: () => void;
}

export const useOfflineStore = create<OfflineState>()((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSync: [],
  syncInProgress: false,
  lastSyncTime: null,
  offlineOrders: [],

  setOnline: (online: boolean) => {
    set({ isOnline: online });
  },

  setSyncInProgress: (inProgress: boolean) => {
    set({ syncInProgress: inProgress });
  },

  addPendingRequest: (request) => {
    const newRequest: PendingRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    set((state) => ({
      pendingSync: [...state.pendingSync, newRequest],
    }));
  },

  removePendingRequest: (id) => {
    set((state) => ({
      pendingSync: state.pendingSync.filter((r) => r.id !== id),
    }));
  },

  addOfflineOrder: (record) => {
    set((state) => ({
      offlineOrders: [...state.offlineOrders, record],
    }));
  },

  removeOfflineOrder: (recordId) => {
    set((state) => ({
      offlineOrders: state.offlineOrders.filter((r) => r.id !== recordId),
    }));
  },

  updatePendingRequest: (id, data) => {
    set((state) => ({
      pendingSync: state.pendingSync.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    }));
  },

  startSync: async () => {
    const { pendingSync, syncInProgress } = get();
    if (syncInProgress || pendingSync.length === 0) return;

    set({ syncInProgress: true });
    const failedRequests: PendingRequest[] = [];

    for (const request of pendingSync) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers,
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        get().removePendingRequest(request.id);
      } catch (error) {
        console.error('Sync failed:', error);
        if (request.retryCount < 3) {
          failedRequests.push({
            ...request,
            retryCount: request.retryCount + 1,
          });
        } else {
          get().removePendingRequest(request.id);
        }
      }
    }

    set({
      pendingSync: failedRequests,
      syncInProgress: false,
      lastSyncTime: Date.now(),
    });
  },

  clearAll: () => {
    set({
      pendingSync: [],
      offlineOrders: [],
      syncInProgress: false,
      lastSyncTime: null,
    });
  },
}));

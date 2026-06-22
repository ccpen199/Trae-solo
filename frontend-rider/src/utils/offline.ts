import { openDB, IDBPDatabase } from 'idb';
import { AxiosRequestConfig } from 'axios';
import type {
  OfflineSyncRecord,
  Order,
  LocationReport,
  OrderStatusUpdateRequest,
} from '@shared/types';
import { useOfflineStore } from '@/store/offlineStore';
import { useAuthStore } from '@/store/authStore';

const DB_NAME = 'rider-offline-db';
const DB_VERSION = 1;

interface OfflineDB {
  pendingRequests: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      data?: any;
      headers?: any;
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-timestamp': number };
  };
  offlineOrders: {
    key: string;
    value: OfflineSyncRecord;
    indexes: { 'by-timestamp': number };
  };
  cachedTasks: {
    key: string;
    value: any;
    indexes: { 'by-timestamp': number };
  };
  locationReports: {
    key: string;
    value: LocationReport;
    indexes: { 'by-timestamp': number };
  };
}

class OfflineSync {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      this.db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('pendingRequests')) {
            const requestsStore = db.createObjectStore('pendingRequests', {
              keyPath: 'id',
            });
            requestsStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('offlineOrders')) {
            const ordersStore = db.createObjectStore('offlineOrders', {
              keyPath: 'id',
            });
            ordersStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('cachedTasks')) {
            const tasksStore = db.createObjectStore('cachedTasks', {
              keyPath: 'id',
            });
            tasksStore.createIndex('by-timestamp', 'timestamp');
          }

          if (!db.objectStoreNames.contains('locationReports')) {
            const locationStore = db.createObjectStore('locationReports', {
              keyPath: 'id',
            });
            locationStore.createIndex('by-timestamp', 'timestamp');
          }
        },
      });

      this.initialized = true;
      await this.loadFromDB();
    } catch (error) {
      console.error('Failed to initialize offline DB:', error);
    }
  }

  private async loadFromDB() {
    if (!this.db) return;

    try {
      const pendingRequests = await this.db.getAll('pendingRequests');
      const offlineOrders = await this.db.getAll('offlineOrders');

      const store = useOfflineStore.getState();
      pendingRequests.forEach((req) => {
        store.addPendingRequest({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers,
        });
      });

      offlineOrders.forEach((order) => {
        store.addOfflineOrder(order);
      });
    } catch (error) {
      console.error('Failed to load from DB:', error);
    }
  }

  async addPendingRequest(config: AxiosRequestConfig) {
    await this.initialize();

    const token = useAuthStore.getState().token;
    const request = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: config.url?.startsWith('http')
        ? config.url
        : `${window.location.origin}/api${config.url}`,
      method: config.method?.toUpperCase() || 'POST',
      data: config.data,
      headers: {
        ...config.headers,
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      timestamp: Date.now(),
      retryCount: 0,
    };

    try {
      if (this.db) {
        await this.db.put('pendingRequests', request);
      }
      useOfflineStore.getState().addPendingRequest({
        url: request.url,
        method: request.method,
        data: request.data,
        headers: request.headers,
      });
    } catch (error) {
      console.error('Failed to save pending request:', error);
    }
  }

  async addOfflineOrder(
    orderData: Partial<Order>,
    action: 'create' | 'accept' | 'status_update',
    statusData?: OrderStatusUpdateRequest
  ) {
    await this.initialize();

    const record: OfflineSyncRecord = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      riderId: useAuthStore.getState().user?.id || '',
      action,
      orderData: orderData as any,
      statusData,
      status: 'pending',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
      retryCount: 0,
    };

    try {
      if (this.db) {
        await this.db.put('offlineOrders', record);
      }
      useOfflineStore.getState().addOfflineOrder(record);
    } catch (error) {
      console.error('Failed to save offline order:', error);
    }
  }

  async addLocationReport(location: LocationReport) {
    await this.initialize();

    const record = {
      ...location,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
      if (this.db) {
        await this.db.put('locationReports', record);
      }
    } catch (error) {
      console.error('Failed to save location report:', error);
    }
  }

  async syncAll() {
    if (!this.db) return;

    const { isOnline } = useOfflineStore.getState();
    if (!isOnline) return;

    const store = useOfflineStore.getState();
    store.setSyncInProgress(true);

    try {
      const pendingRequests = await this.db.getAll('pendingRequests');
      const offlineOrders = await this.db.getAll('offlineOrders');

      for (const request of pendingRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.data ? JSON.stringify(request.data) : undefined,
          });

          if (response.ok) {
            await this.db.delete('pendingRequests', request.id);
            store.removePendingRequest(request.id);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('Sync request failed:', error);
          if (request.retryCount < 3) {
            const updated = { ...request, retryCount: request.retryCount + 1 };
            await this.db.put('pendingRequests', updated);
            store.updatePendingRequest(request.id, { retryCount: request.retryCount + 1 });
          } else {
            await this.db.delete('pendingRequests', request.id);
            store.removePendingRequest(request.id);
          }
        }
      }

      for (const order of offlineOrders) {
        try {
          await this.syncOfflineOrder(order);
          await this.db.delete('offlineOrders', order.id);
          store.removeOfflineOrder(order.id);
        } catch (error) {
          console.error('Sync order failed:', error);
          if (order.retryCount < 3) {
            const updated = { ...order, retryCount: order.retryCount + 1 };
            await this.db.put('offlineOrders', updated);
          } else {
            await this.db.delete('offlineOrders', order.id);
            store.removeOfflineOrder(order.id);
          }
        }
      }
    } finally {
      store.setSyncInProgress(false);
    }
  }

  private async syncOfflineOrder(record: OfflineSyncRecord) {
    const token = useAuthStore.getState().token;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };

    let url = '';
    let method = 'POST';
    let body: any = record.orderData;

    switch (record.action) {
      case 'create':
        url = '/api/orders';
        method = 'POST';
        break;
      case 'accept':
        url = `/api/tasks/accept`;
        method = 'POST';
        body = { taskId: record.orderData.id };
        break;
      case 'status_update':
        url = `/api/orders/${record.orderData.id}/status`;
        method = 'PUT';
        body = record.statusData;
        break;
    }

    const response = await fetch(`${window.location.origin}${url}`, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async clear() {
    if (this.db) {
      await this.db.clear('pendingRequests');
      await this.db.clear('offlineOrders');
      await this.db.clear('cachedTasks');
      await this.db.clear('locationReports');
    }
    useOfflineStore.getState().clearAll();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const offlineSync = new OfflineSync();

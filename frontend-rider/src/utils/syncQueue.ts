import { openDB, IDBPDatabase } from 'idb';

export type SyncPriority = 'urgent' | 'normal' | 'low';

export interface QueueItem {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  priority: SyncPriority;
  retryCount: number;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface QueueStatus {
  pending: number;
  processing: number;
  urgent: number;
  normal: number;
  low: number;
  total: number;
}

const DB_NAME = 'rider-sync-queue';
const DB_VERSION = 1;
const MAX_RETRIES = 3;
const EXPIRY_MS = 24 * 60 * 60 * 1000;

interface SyncQueueDB {
  syncQueue: {
    key: string;
    value: QueueItem;
    indexes: {
      'by-priority': SyncPriority;
      'by-timestamp': number;
      'by-status': QueueItem['status'];
    };
  };
}

class SyncQueue {
  private db: IDBPDatabase<SyncQueueDB> | null = null;
  private processing = false;

  private async getDB(): Promise<IDBPDatabase<SyncQueueDB>> {
    if (this.db) return this.db;

    this.db = await openDB<SyncQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('by-priority', 'priority');
          store.createIndex('by-timestamp', 'timestamp');
          store.createIndex('by-status', 'status');
        }
      },
    });

    return this.db;
  }

  async enqueue(request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    priority?: SyncPriority;
  }): Promise<string> {
    const db = await this.getDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const item: QueueItem = {
      id,
      url: request.url,
      method: request.method.toUpperCase(),
      headers: request.headers,
      body: request.body,
      priority: request.priority ?? 'normal',
      retryCount: 0,
      timestamp: Date.now(),
      status: 'pending',
    };

    await db.put('syncQueue', item);

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register('sync-offline-queue');
      } catch {}
    }

    return id;
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const db = await this.getDB();
      const allItems = await db.getAll('syncQueue');

      const pendingItems = allItems
        .filter((item) => item.status === 'pending' || item.status === 'failed')
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = { urgent: 0, normal: 1, low: 2 };
          const pa = priorityOrder[a.priority as string] ?? 1;
          const pb = priorityOrder[b.priority as string] ?? 1;
          if (pa !== pb) return pa - pb;
          return a.timestamp - b.timestamp;
        });

      for (const item of pendingItems) {
        await db.put('syncQueue', { ...item, status: 'processing' });

        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
              ...item.headers,
            },
            body: item.body ? JSON.stringify(item.body) : undefined,
          });

          if (response.ok) {
            await db.delete('syncQueue', item.id);
          } else {
            await this.handleRetry(db, item);
          }
        } catch {
          await this.handleRetry(db, item);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async handleRetry(db: IDBPDatabase<SyncQueueDB>, item: QueueItem): Promise<void> {
    const retryCount = item.retryCount + 1;

    if (retryCount >= MAX_RETRIES) {
      await db.put('syncQueue', {
        ...item,
        retryCount,
        status: 'failed',
      });
    } else {
      await db.put('syncQueue', {
        ...item,
        retryCount,
        status: 'pending',
      });
    }
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const db = await this.getDB();
    const allItems = await db.getAll('syncQueue');

    return {
      pending: allItems.filter((i) => i.status === 'pending').length,
      processing: allItems.filter((i) => i.status === 'processing').length,
      urgent: allItems.filter((i) => i.priority === 'urgent' && i.status !== 'completed').length,
      normal: allItems.filter((i) => i.priority === 'normal' && i.status !== 'completed').length,
      low: allItems.filter((i) => i.priority === 'low' && i.status !== 'completed').length,
      total: allItems.filter((i) => i.status !== 'completed').length,
    };
  }

  async cleanup(): Promise<void> {
    const db = await this.getDB();
    const allItems = await db.getAll('syncQueue');
    const now = Date.now();

    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    for (const item of allItems) {
      if (item.status === 'completed' || item.status === 'failed') {
        await store.delete(item.id);
      } else if (now - item.timestamp > EXPIRY_MS) {
        await store.delete(item.id);
      } else if (item.retryCount >= MAX_RETRIES) {
        await store.delete(item.id);
      }
    }

    await tx.done;
  }
}

export const syncQueue = new SyncQueue();

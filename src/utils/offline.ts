import localforage from 'localforage';

localforage.config({
  name: 'StudentFundingDB',
  version: 1.0,
  storeName: 'offlineCache',
  description: '中职学生资助监管平台离线缓存',
});

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface PendingRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  timestamp: number;
}

export const offlineStorage = localforage;

const DEFAULT_CACHE_TTL = 30 * 60 * 1000;

export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  await localforage.setItem(key, cacheItem);
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheItem = await localforage.getItem<CacheItem<T>>(key);
    if (!cacheItem) return null;

    if (Date.now() > cacheItem.expiresAt) {
      await localforage.removeItem(key);
      return null;
    }

    return cacheItem.data;
  } catch {
    return null;
  }
}

export async function removeCache(key: string): Promise<void> {
  await localforage.removeItem(key);
}

export async function clearCache(): Promise<void> {
  await localforage.clear();
}

export async function getCacheInfo(): Promise<{
  keys: string[];
  totalSize: number;
  expiredCount: number;
}> {
  const keys = await localforage.keys();
  let totalSize = 0;
  let expiredCount = 0;

  for (const key of keys) {
    const item = await localforage.getItem<CacheItem<any>>(key);
    if (item) {
      totalSize += JSON.stringify(item).length;
      if (Date.now() > item.expiresAt) {
        expiredCount++;
      }
    }
  }

  return { keys, totalSize, expiredCount };
}

export async function cleanExpiredCache(): Promise<number> {
  const keys = await localforage.keys();
  let cleanedCount = 0;

  for (const key of keys) {
    const item = await localforage.getItem<CacheItem<any>>(key);
    if (item && Date.now() > item.expiresAt) {
      await localforage.removeItem(key);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

const PENDING_REQUESTS_KEY = 'pending_requests';

export async function addPendingRequest(request: Omit<PendingRequest, 'id' | 'timestamp'>): Promise<void> {
  const requests = await getPendingRequests();
  const newRequest: PendingRequest = {
    ...request,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  requests.push(newRequest);
  await localforage.setItem(PENDING_REQUESTS_KEY, requests);
}

export async function getPendingRequests(): Promise<PendingRequest[]> {
  const requests = await localforage.getItem<PendingRequest[]>(PENDING_REQUESTS_KEY);
  return requests || [];
}

export async function removePendingRequest(id: string): Promise<void> {
  const requests = await getPendingRequests();
  const filtered = requests.filter((r) => r.id !== id);
  await localforage.setItem(PENDING_REQUESTS_KEY, filtered);
}

export async function clearPendingRequests(): Promise<void> {
  await localforage.removeItem(PENDING_REQUESTS_KEY);
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function onOnline(callback: () => void): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  }
  return () => {};
}

export function onOffline(callback: () => void): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  }
  return () => {};
}

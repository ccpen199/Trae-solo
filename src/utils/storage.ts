import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'express_app_';

interface StorageOptions {
  encrypt?: boolean;
  expireTime?: number;
}

interface StorageItem<T> {
  data: T;
  timestamp: number;
  expireTime?: number;
}

export const setStorage = <T>(key: string, data: T, options?: StorageOptions): void => {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const item: StorageItem<T> = {
    data,
    timestamp: Date.now(),
    expireTime: options?.expireTime
  };

  try {
    const value = JSON.stringify(item);
    Taro.setStorageSync(storageKey, value);
    console.log(`[Storage] 写入成功: ${key}`);
  } catch (e) {
    console.error(`[Storage] 写入失败: ${key}`, e);
    throw e;
  }
};

export const getStorage = <T>(key: string): T | null => {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  try {
    const value = Taro.getStorageSync(storageKey);
    if (!value) {
      console.log(`[Storage] 无数据: ${key}`);
      return null;
    }

    const item: StorageItem<T> = JSON.parse(value);

    if (item.expireTime && Date.now() > item.expireTime) {
      console.log(`[Storage] 数据已过期: ${key}`);
      removeStorage(key);
      return null;
    }

    console.log(`[Storage] 读取成功: ${key}`);
    return item.data;
  } catch (e) {
    console.error(`[Storage] 读取失败: ${key}`, e);
    return null;
  }
};

export const removeStorage = (key: string): void => {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  try {
    Taro.removeStorageSync(storageKey);
    console.log(`[Storage] 删除成功: ${key}`);
  } catch (e) {
    console.error(`[Storage] 删除失败: ${key}`, e);
  }
};

export const hasStorage = (key: string): boolean => {
  return getStorage(key) !== null;
};

export const clearAllStorage = (): void => {
  try {
    Taro.clearStorageSync();
    console.log('[Storage] 清空所有数据');
  } catch (e) {
    console.error('[Storage] 清空失败:', e);
  }
};

export const getStorageInfo = (): { keys: string[]; currentSize: number; limitSize: number } => {
  try {
    const info = Taro.getStorageInfoSync();
    return {
      keys: info.keys.filter(k => k.startsWith(STORAGE_PREFIX)).map(k => k.replace(STORAGE_PREFIX, '')),
      currentSize: info.currentSize,
      limitSize: info.limitSize
    };
  } catch (e) {
    console.error('[Storage] 获取信息失败:', e);
    return { keys: [], currentSize: 0, limitSize: 0 };
  }
};

export const saveOfflineData = <T>(type: string, data: T): void => {
  const key = `offline_${type}_${Date.now()}`;
  setStorage(key, data, {
    expireTime: Date.now() + 24 * 60 * 60 * 1000
  });
  syncOfflineQueue(type, key);
};

const syncOfflineQueue = (type: string, key: string): void => {
  const queueKey = `offline_queue_${type}`;
  const queue = getStorage<string[]>(queueKey) || [];
  queue.push(key);
  setStorage(queueKey, queue);
};

export const getOfflineData = <T>(type: string): T[] => {
  const queueKey = `offline_queue_${type}`;
  const queue = getStorage<string[]>(queueKey) || [];
  const data: T[] = [];

  for (const key of queue) {
    const item = getStorage<T>(key);
    if (item) {
      data.push(item);
    }
  }

  return data;
};

export const clearOfflineData = (type: string, key?: string): void => {
  if (key) {
    removeStorage(key);
    const queueKey = `offline_queue_${type}`;
    const queue = getStorage<string[]>(queueKey) || [];
    const newQueue = queue.filter(k => k !== key);
    setStorage(queueKey, newQueue);
  } else {
    const queueKey = `offline_queue_${type}`;
    const queue = getStorage<string[]>(queueKey) || [];
    queue.forEach(k => removeStorage(k));
    removeStorage(queueKey);
  }
};

export const getOfflineDataCount = (type: string): number => {
  const queueKey = `offline_queue_${type}`;
  const queue = getStorage<string[]>(queueKey) || [];
  return queue.length;
};

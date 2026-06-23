import Taro from '@tarojs/taro';
import { encryptECB, decryptECB, SM4_KEY } from './sm4';

const STORAGE_PREFIX = 'mobile_office_';

export function setStorage(key: string, value: any, needEncrypt: boolean = false): void {
  try {
    const storageKey = STORAGE_PREFIX + key;
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (needEncrypt) {
      const encrypted = encryptECB(strValue, SM4_KEY);
      Taro.setStorageSync(storageKey, encrypted);
    } else {
      Taro.setStorageSync(storageKey, strValue);
    }
    console.log(`[Storage] Set ${key} success`);
  } catch (error) {
    console.error(`[Storage] Set ${key} failed:`, error);
  }
}

export function getStorage<T = any>(key: string, needDecrypt: boolean = false, defaultValue?: T): T | null {
  try {
    const storageKey = STORAGE_PREFIX + key;
    const value = Taro.getStorageSync(storageKey);
    
    if (!value) {
      return defaultValue || null;
    }
    
    if (needDecrypt) {
      const decrypted = decryptECB(value, SM4_KEY);
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted as unknown as T;
      }
    } else {
      try {
        return JSON.parse(value);
      } catch {
        return value as unknown as T;
      }
    }
  } catch (error) {
    console.error(`[Storage] Get ${key} failed:`, error);
    return defaultValue || null;
  }
}

export function removeStorage(key: string): void {
  try {
    const storageKey = STORAGE_PREFIX + key;
    Taro.removeStorageSync(storageKey);
    console.log(`[Storage] Remove ${key} success`);
  } catch (error) {
    console.error(`[Storage] Remove ${key} failed:`, error);
  }
}

export function clearStorage(): void {
  try {
    const keys = Taro.getStorageInfoSync().keys;
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        Taro.removeStorageSync(key);
      }
    });
    console.log('[Storage] Clear all storage success');
  } catch (error) {
    console.error('[Storage] Clear storage failed:', error);
  }
}

export default {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage
};

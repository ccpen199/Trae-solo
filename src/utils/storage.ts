import { encryptAES, decryptAES } from './crypto'

const STORAGE_PREFIX = 'sd_tourism_'

export const StorageKeys = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  PERMISSIONS: 'permissions',
  THEME: 'theme',
  LANGUAGE: 'language',
  REMEMBER_ME: 'remember_me',
  LOGIN_FORM: 'login_form',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  SEARCH_HISTORY: 'search_history',
  REGION_CODE: 'region_code',
  EXPIRES_AT: 'expires_at'
} as const

type StorageKeyType = typeof StorageKeys[keyof typeof StorageKeys]

const getKey = (key: StorageKeyType): string => {
  return STORAGE_PREFIX + key
}

export const storage = {
  set(key: StorageKeyType, value: any, encrypt: boolean = true): void {
    try {
      const storageKey = getKey(key)
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      const finalValue = encrypt ? encryptAES(stringValue) : stringValue
      localStorage.setItem(storageKey, finalValue)
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  get<T = any>(key: StorageKeyType, encrypt: boolean = true, defaultValue?: T): T | null {
    try {
      const storageKey = getKey(key)
      const value = localStorage.getItem(storageKey)
      if (value === null) {
        return defaultValue ?? null
      }
      const decrypted = encrypt ? decryptAES(value) : value
      if (!decrypted) {
        return defaultValue ?? null
      }
      try {
        return JSON.parse(decrypted) as T
      } catch {
        return decrypted as unknown as T
      }
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue ?? null
    }
  },

  remove(key: StorageKeyType): void {
    try {
      const storageKey = getKey(key)
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  clear(): void {
    try {
      Object.values(StorageKeys).forEach(key => {
        const storageKey = getKey(key)
        localStorage.removeItem(storageKey)
      })
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  },

  has(key: StorageKeyType): boolean {
    try {
      const storageKey = getKey(key)
      return localStorage.getItem(storageKey) !== null
    } catch {
      return false
    }
  },

  setWithExpiry(key: StorageKeyType, value: any, expiresIn: number, encrypt: boolean = true): void {
    const expiry = Date.now() + expiresIn * 1000
    const data = {
      value,
      expiry
    }
    this.set(key, data, encrypt)
  },

  getWithExpiry<T = any>(key: StorageKeyType, encrypt: boolean = true): T | null {
    const data = this.get(key, encrypt) as { value: T; expiry: number } | null
    if (!data) {
      return null
    }
    if (Date.now() > data.expiry) {
      this.remove(key)
      return null
    }
    return data.value
  }
}

export const sessionStorage = {
  set(key: string, value: any, encrypt: boolean = true): void {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      const finalValue = encrypt ? encryptAES(stringValue) : stringValue
      window.sessionStorage.setItem(key, finalValue)
    } catch (error) {
      console.error('SessionStorage set error:', error)
    }
  },

  get<T = any>(key: string, encrypt: boolean = true): T | null {
    try {
      const value = window.sessionStorage.getItem(key)
      if (value === null) {
        return null
      }
      const decrypted = encrypt ? decryptAES(value) : value
      if (!decrypted) {
        return null
      }
      try {
        return JSON.parse(decrypted) as T
      } catch {
        return decrypted as unknown as T
      }
    } catch (error) {
      console.error('SessionStorage get error:', error)
      return null
    }
  },

  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key)
    } catch (error) {
      console.error('SessionStorage remove error:', error)
    }
  },

  clear(): void {
    try {
      window.sessionStorage.clear()
    } catch (error) {
      console.error('SessionStorage clear error:', error)
    }
  }
}

export default storage

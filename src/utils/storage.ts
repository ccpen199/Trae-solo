const DEFAULT_PREFIX = 'fz_gov_'

interface StorageOptions {
  prefix?: string
  expires?: number
}

interface StorageData<T = unknown> {
  value: T
  expires?: number
  timestamp: number
}

class StorageWrapper {
  private prefix: string

  constructor(prefix: string = DEFAULT_PREFIX) {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  set<T = unknown>(key: string, value: T, options?: StorageOptions): void {
    try {
      const data: StorageData<T> = {
        value,
        timestamp: Date.now()
      }
      if (options?.expires) {
        data.expires = Date.now() + options.expires * 1000
      }
      const storageKey = this.getKey(key)
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  }

  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const storageKey = this.getKey(key)
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaultValue

      const data: StorageData<T> = JSON.parse(raw)
      if (data.expires && Date.now() > data.expires) {
        this.remove(key)
        return defaultValue
      }
      return data.value
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  }

  remove(key: string): void {
    try {
      const storageKey = this.getKey(key)
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error('Storage remove error:', e)
    }
  }

  clear(): void {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key)
        }
      }
      keys.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      console.error('Storage clear error:', e)
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  keys(): string[] {
    const result: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length))
      }
    }
    return result
  }

  getExpires(key: string): number | undefined {
    try {
      const storageKey = this.getKey(key)
      const raw = localStorage.getItem(storageKey)
      if (!raw) return undefined
      const data: StorageData = JSON.parse(raw)
      return data.expires
    } catch {
      return undefined
    }
  }
}

const storage = new StorageWrapper()

export { StorageWrapper, storage }
export default storage

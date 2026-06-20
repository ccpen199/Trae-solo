const PREFIX = 'app_';

export const storage = {
  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(PREFIX + key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T = unknown>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      console.error('Failed to save to localStorage');
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      console.error('Failed to remove from localStorage');
    }
  },

  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keys.push(key);
        }
      }
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      console.error('Failed to clear localStorage');
    }
  },

  has(key: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(PREFIX + key) !== null;
  },
};

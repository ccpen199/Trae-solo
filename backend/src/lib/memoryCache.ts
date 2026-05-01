interface CacheEntry {
  value: string;
  expireAt?: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expireAt && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    const expireAt = Date.now() + seconds * 1000;
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (entry.expireAt && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expireAt = Date.now() + seconds * 1000;
    return 1;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    const entry = this.store.get(key);
    let hash: Record<string, string>;
    
    if (entry) {
      if (entry.expireAt && Date.now() > entry.expireAt) {
        hash = {};
      } else {
        try {
          hash = JSON.parse(entry.value);
        } catch {
          hash = {};
        }
      }
    } else {
      hash = {};
    }
    
    const isNew = !hash[field];
    hash[field] = value;
    this.store.set(key, { value: JSON.stringify(hash), expireAt: entry?.expireAt });
    
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expireAt && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return null;
    }
    
    try {
      const hash = JSON.parse(entry.value);
      return hash[field] || null;
    } catch {
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const entry = this.store.get(key);
    if (!entry) return {};
    if (entry.expireAt && Date.now() > entry.expireAt) {
      this.store.delete(key);
      return {};
    }
    
    try {
      return JSON.parse(entry.value);
    } catch {
      return {};
    }
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const entry = this.store.get(key);
    let hash: Record<string, number>;
    
    if (entry) {
      if (entry.expireAt && Date.now() > entry.expireAt) {
        hash = {};
      } else {
        try {
          hash = JSON.parse(entry.value);
        } catch {
          hash = {};
        }
      }
    } else {
      hash = {};
    }
    
    const current = hash[field] || 0;
    const newValue = current + increment;
    hash[field] = newValue;
    this.store.set(key, { value: JSON.stringify(hash), expireAt: entry?.expireAt });
    
    return newValue;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const entry = this.store.get(key);
    let set: Set<string>;
    
    if (entry) {
      if (entry.expireAt && Date.now() > entry.expireAt) {
        set = new Set();
      } else {
        try {
          set = new Set(JSON.parse(entry.value));
        } catch {
          set = new Set();
        }
      }
    } else {
      set = new Set();
    }
    
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    
    this.store.set(key, { value: JSON.stringify(Array.from(set)), expireAt: entry?.expireAt });
    return added;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    let sortedSet = this.sortedSets.get(key);
    if (!sortedSet) {
      sortedSet = new Map();
      this.sortedSets.set(key, sortedSet);
    }
    
    const isNew = !sortedSet.has(member);
    sortedSet.set(member, score);
    return isNew ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async disconnect(): Promise<void> {
    this.store.clear();
    this.sortedSets.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + 
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      + '$'
    );
    
    const results: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        results.push(key);
      }
    }
    return results;
  }
}

export const memoryCache = new MemoryCache();
export default memoryCache;

import { v4 as uuidv4 } from 'uuid';
import { QueueItem } from '../types';

interface RedisStore {
  queues: Map<string, QueueItem[]>;
  patientStatus: Map<string, string>;
  reservationCodes: Map<string, string>;
  general: Map<string, string>;
}

let store: RedisStore = {
  queues: new Map(),
  patientStatus: new Map(),
  reservationCodes: new Map(),
  general: new Map()
};

class MockRedis {
  constructor(options?: any) {
    console.log('Mock Redis initialized');
  }

  async get(key: string): Promise<string | null> {
    return store.general.get(key) || null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string> {
    store.general.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = store.general.has(key);
    store.general.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return store.general.has(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(store.general.get(key) || '0');
    const newValue = current + 1;
    store.general.set(key, newValue.toString());
    return newValue;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    let queue = this.getQueue(key);
    values.forEach(v => {
      try {
        queue.unshift(JSON.parse(v));
      } catch {
        queue.unshift({ value: v });
      }
    });
    store.queues.set(key, queue);
    return queue.length;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    let queue = this.getQueue(key);
    values.forEach(v => {
      try {
        queue.push(JSON.parse(v));
      } catch {
        queue.push({ value: v });
      }
    });
    store.queues.set(key, queue);
    return queue.length;
  }

  async lpop(key: string): Promise<string | null> {
    const queue = this.getQueue(key);
    if (queue.length === 0) return null;
    const item = queue.shift();
    store.queues.set(key, queue);
    return item ? JSON.stringify(item) : null;
  }

  async rpop(key: string): Promise<string | null> {
    const queue = this.getQueue(key);
    if (queue.length === 0) return null;
    const item = queue.pop();
    store.queues.set(key, queue);
    return item ? JSON.stringify(item) : null;
  }

  async llen(key: string): Promise<number> {
    return this.getQueue(key).length;
  }

  async lrange(key: string, start: number, end: number): Promise<string[]> {
    const queue = this.getQueue(key);
    const actualEnd = end === -1 ? queue.length : end + 1;
    return queue.slice(start, actualEnd).map(item => JSON.stringify(item));
  }

  async lrem(key: string, count: number, value: string): Promise<number> {
    const queue = this.getQueue(key);
    let removed = 0;
    const newQueue = queue.filter(item => {
      if (JSON.stringify(item) === value || item.value === value) {
        if (removed < Math.abs(count) || count === 0) {
          removed++;
          return false;
        }
      }
      return true;
    });
    store.queues.set(key, newQueue);
    return removed;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    let hash = JSON.parse(store.general.get(key) || '{}');
    hash[field] = value;
    store.general.set(key, JSON.stringify(hash));
    return 1;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = JSON.parse(store.general.get(key) || '{}');
    return hash[field] || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return JSON.parse(store.general.get(key) || '{}');
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = JSON.parse(store.general.get(key) || '{}');
    let deleted = 0;
    fields.forEach(field => {
      if (hash[field] !== undefined) {
        delete hash[field];
        deleted++;
      }
    });
    if (Object.keys(hash).length === 0) {
      store.general.delete(key);
    } else {
      store.general.set(key, JSON.stringify(hash));
    }
    return deleted;
  }

  async expire(key: string, seconds: number): Promise<number> {
    return 1;
  }

  async zadd(key: string, ...scoreMembers: (string | number)[]): Promise<number> {
    let sortedSet = JSON.parse(store.general.get(key) || '{}');
    let added = 0;
    for (let i = 0; i < scoreMembers.length; i += 2) {
      const score = scoreMembers[i] as number;
      const member = scoreMembers[i + 1] as string;
      if (!sortedSet[member]) added++;
      sortedSet[member] = score;
    }
    store.general.set(key, JSON.stringify(sortedSet));
    return added;
  }

  async zrange(key: string, start: number, stop: number, withScores?: string): Promise<string[]> {
    const sortedSet = JSON.parse(store.general.get(key) || '{}');
    const entries = Object.entries(sortedSet)
      .sort(([, a], [, b]) => (a as number) - (b as number));
    
    const actualStop = stop === -1 ? entries.length : stop + 1;
    const sliced = entries.slice(start, actualStop);
    
    if (withScores === 'WITHSCORES') {
      const result: string[] = [];
      sliced.forEach(([member, score]) => {
        result.push(member, String(score));
      });
      return result;
    }
    return sliced.map(([member]) => member);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const sortedSet = JSON.parse(store.general.get(key) || '{}');
    let removed = 0;
    members.forEach(member => {
      if (sortedSet[member] !== undefined) {
        delete sortedSet[member];
        removed++;
      }
    });
    store.general.set(key, JSON.stringify(sortedSet));
    return removed;
  }

  async zcard(key: string): Promise<number> {
    const sortedSet = JSON.parse(store.general.get(key) || '{}');
    return Object.keys(sortedSet).length;
  }

  private getQueue(key: string): any[] {
    return store.queues.get(key) || [];
  }

  disconnect(): void {
    console.log('Mock Redis disconnected');
  }

  quit(): Promise<'OK'> {
    return Promise.resolve('OK');
  }
}

export const redis = new MockRedis();
export const redisClient = redis;

export const getQueueKey = (departmentId: string) => `queue:${departmentId}`;
export const getPatientStatusKey = (patientId: string) => `patient:${patientId}:status`;
export const getReservationCodeKey = (code: string) => `reservation:${code}`;

export { store };

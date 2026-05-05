import { createClient, RedisClientType } from 'redis';
import { config } from '../config';

class MemoryRedis {
  private store: Map<string, { value: string; expireAt?: number }> = new Map();
  
  async connect(): Promise<void> {
    console.log('使用内存Redis模式');
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    this.store.set(key, {
      value,
      expireAt: Date.now() + seconds * 1000
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) || 0) + 1;
    const item = this.store.get(key);
    this.store.set(key, {
      value: newValue.toString(),
      expireAt: item?.expireAt
    });
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expireAt = Date.now() + seconds * 1000;
      this.store.set(key, item);
    }
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expireAt) return -1;
    const remaining = Math.ceil((item.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  async publish(_channel: string, _message: string): Promise<void> {
    // 内存模式下不处理发布订阅
  }
}

class RedisService {
  private client: RedisClientType | null = null;
  private memoryClient: MemoryRedis | null = null;
  private isConnected = false;
  private useMemory = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url
      });

      this.client.on('error', (err) => {
        console.error('Redis连接错误，切换到内存模式:', err);
        this.useMemory = true;
        this.memoryClient = new MemoryRedis();
      });

      this.client.on('connect', () => {
        console.log('Redis已连接');
        this.isConnected = true;
        this.useMemory = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.warn('Redis初始化失败，切换到内存模式:', error);
      this.useMemory = true;
      this.memoryClient = new MemoryRedis();
      await this.memoryClient.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
    if (this.memoryClient) {
      await this.memoryClient.disconnect();
      this.memoryClient = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory && this.memoryClient) {
      return this.memoryClient.get(key);
    }
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      if (this.memoryClient) {
        return this.memoryClient.get(key);
      }
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.useMemory && this.memoryClient) {
      if (ttl) {
        await this.memoryClient.setEx(key, ttl, value);
      } else {
        await this.memoryClient.set(key, value);
      }
      return;
    }
    try {
      if (!this.client) return;
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      if (this.memoryClient) {
        if (ttl) {
          await this.memoryClient.setEx(key, ttl, value);
        } else {
          await this.memoryClient.set(key, value);
        }
      }
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemory && this.memoryClient) {
      return this.memoryClient.del(key);
    }
    try {
      if (!this.client) return;
      await this.client.del(key);
    } catch {
      if (this.memoryClient) {
        await this.memoryClient.del(key);
      }
    }
  }

  async incr(key: string): Promise<number> {
    if (this.useMemory && this.memoryClient) {
      return this.memoryClient.incr(key);
    }
    try {
      if (!this.client) return 0;
      return await this.client.incr(key);
    } catch {
      if (this.memoryClient) {
        return this.memoryClient.incr(key);
      }
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.useMemory && this.memoryClient) {
      return this.memoryClient.expire(key, seconds);
    }
    try {
      if (!this.client) return;
      await this.client.expire(key, seconds);
    } catch {
      if (this.memoryClient) {
        await this.memoryClient.expire(key, seconds);
      }
    }
  }

  async getClient() {
    if (this.useMemory) {
      return {
        ttl: (key: string) => this.memoryClient?.ttl(key) || -2
      };
    }
    return {
      ttl: (key: string) => this.client?.ttl(key) || -2
    };
  }

  async publish(channel: string, message: string): Promise<void> {
    if (this.useMemory || !this.client || !this.isConnected) {
      return;
    }
    try {
      await this.client.publish(channel, message);
    } catch {
      // 静默失败
    }
  }
}

export const redisService = new RedisService();

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const USE_REDIS = process.env.USE_REDIS === 'true';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

// Redis 客户端（可选，用于缓存和消息队列）
let redis: Redis | null = null;

if (USE_REDIS) {
  redis = new Redis(redisConfig);
  
  redis.on('connect', () => {
    console.log('✅ Redis 连接成功');
  });
  
  redis.on('error', (err) => {
    console.error('❌ Redis 连接失败:', err.message);
    console.log('ℹ️  Redis 降级方案：缓存功能将使用内存实现，消息队列将禁用');
    redis = null;
  });
}

// 降级后的缓存接口
interface CacheInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}

// 内存缓存（降级方案）
const memoryCache = new Map<string, { value: string; expires: number }>();

const memoryCacheImpl: CacheInterface = {
  async get(key: string): Promise<string | null> {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },
  
  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  },
  
  async del(key: string): Promise<void> {
    memoryCache.delete(key);
  },
};

// Redis 缓存实现
const redisCacheImpl: CacheInterface = {
  async get(key: string): Promise<string | null> {
    if (!redis) return memoryCacheImpl.get(key);
    return redis.get(key);
  },
  
  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    if (!redis) return memoryCacheImpl.set(key, value, ttl);
    await redis.set(key, value, 'EX', ttl);
  },
  
  async del(key: string): Promise<void> {
    if (!redis) return memoryCacheImpl.del(key);
    await redis.del(key);
  },
};

export const cache = redis ? redisCacheImpl : memoryCacheImpl;
export { redis, USE_REDIS };

// Redis 降级方案说明：
// 1. 通过 USE_REDIS 环境变量控制是否启用 Redis
// 2. 若 Redis 不可用或未启用，自动降级到内存缓存
// 3. 内存缓存是 Map 实现，适合单进程环境
// 4. 消息队列功能（如任务通知）需要 Redis，降级后将禁用

import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_PREFIX = 'coupon_platform:'

class RedisCache {
  private client: Redis | null = null

  async getClient(): Promise<Redis | null> {
    if (process.env.DISABLE_REDIS === '1') {
      return null
    }
    if (!this.client) {
      try {
        this.client = new Redis(REDIS_URL, {
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        })
        this.client.on('error', () => {})
      } catch (error) {
        console.warn('Redis connection failed, using in-memory fallback')
        this.client = null
      }
    }
    return this.client
  }

  private getKey(key: string): string {
    return `${REDIS_PREFIX}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient()
      if (!client) return this.getFallback<T>(key)
      
      const data = await client.get(this.getKey(key))
      return data ? JSON.parse(data) : null
    } catch (error) {
      return this.getFallback<T>(key)
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const client = await this.getClient()
      if (!client) {
        this.setFallback(key, value, ttlSeconds)
        return
      }
      
      const data = JSON.stringify(value)
      if (ttlSeconds) {
        await client.setex(this.getKey(key), ttlSeconds, data)
      } else {
        await client.set(this.getKey(key), data)
      }
    } catch (error) {
      this.setFallback(key, value, ttlSeconds)
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient()
      if (!client) {
        this.delFallback(key)
        return
      }
      await client.del(this.getKey(key))
    } catch (error) {
      this.delFallback(key)
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const client = await this.getClient()
      if (!client) return this.incrFallback(key)
      return await client.incr(this.getKey(key))
    } catch (error) {
      return this.incrFallback(key)
    }
  }

  async decr(key: string): Promise<number> {
    try {
      const client = await this.getClient()
      if (!client) return this.decrFallback(key)
      return await client.decr(this.getKey(key))
    } catch (error) {
      return this.decrFallback(key)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      if (!client) return this.existsFallback(key)
      return (await client.exists(this.getKey(key))) > 0
    } catch (error) {
      return this.existsFallback(key)
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const client = await this.getClient()
      if (!client) return
      await client.expire(this.getKey(key), ttlSeconds)
    } catch (error) {
      // ignore
    }
  }

  private fallbackStore = new Map<string, { value: string; expiresAt?: number }>()

  private getFallback<T>(key: string): T | null {
    const item = this.fallbackStore.get(key)
    if (!item) return null
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.fallbackStore.delete(key)
      return null
    }
    return JSON.parse(item.value) as T
  }

  private setFallback(key: string, value: unknown, ttlSeconds?: number): void {
    this.fallbackStore.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }

  private delFallback(key: string): void {
    this.fallbackStore.delete(key)
  }

  private incrFallback(key: string): number {
    const current = this.getFallback<number>(key) || 0
    const next = current + 1
    this.setFallback(key, next)
    return next
  }

  private decrFallback(key: string): number {
    const current = this.getFallback<number>(key) || 0
    const next = Math.max(0, current - 1)
    this.setFallback(key, next)
    return next
  }

  private existsFallback(key: string): boolean {
    return this.fallbackStore.has(key)
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
  }
}

export const redisCache = new RedisCache()

export const getInventoryCacheKey = (activityId: string): string => `inventory:${activityId}`
export const getSessionCacheKey = (userId: string): string => `session:${userId}`
export const getTokenBlacklistKey = (token: string): string => `blacklist:${token}`

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisCache.getClient()
    console.log('Redis client initialized')
  } catch (error) {
    console.warn('Redis initialization failed, using in-memory fallback:', error instanceof Error ? error.message : error)
  }
}
